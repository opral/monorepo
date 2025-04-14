import type * as LixServerProtocol from "@lix-js/server-protocol-schema";
import type { LixServerProtocolHandlerRoute } from "../create-server-protocol-handler.js";
import { mergeTheirState } from "../../sync/merge-state.js";
import type { Change } from "../../database/schema.js";
// import { detectChangeConflicts } from "../../change-conflict/detect-change-conflicts.js";
// import { createChangeConflict } from "../../change-conflict/create-change-conflict.js";
import { CompiledQuery } from "kysely";

type RequestBody =
	LixServerProtocol.paths["/lsp/push-v1"]["post"]["requestBody"]["content"]["application/json"];

type ResponseBody =
	LixServerProtocol.paths["/lsp/push-v1"]["post"]["responses"];

export const route: LixServerProtocolHandlerRoute = async (context) => {
	const body = (await context.request.json()) as RequestBody;
	const exists = await context.environment.hasLix({ id: body.lix_id });

	if (!exists) {
		return new Response(null, { status: 404 });
	}

	const open = await context.environment.openLix({ id: body.lix_id });

	try {
		// console.log(
		// 	"----------- PROCESSING PUSH FROM CLIENT  --s----------- with state:",
		// 	body.vector_clock
		// );

		await open.lix.db.transaction().execute(async (trx) => {
			await trx.executeQuery(
				CompiledQuery.raw("PRAGMA defer_foreign_keys = ON;")
			);

			await mergeTheirState({
				lix: { ...open.lix, db: trx },
				sourceVectorClock: body.vector_clock,
				sourceData: body.data,
			});

			const allIncomingChanges = (body.data.change ?? []) as Change[];

			// retrieve the version change updates from the changes
			const incomingVersionChanges: Record<string, Change[]> = {};

			for (const change of (body.data.change ?? []) as Change[]) {
				if (change.schema_key !== "lix_version_change_table") {
					continue;
				}
				const [versionId] = change.entity_id.split(",");
				if (versionId === undefined) {
					throw new Error("Expected versionId to be defined");
				}
				// safe assignment
				if (!incomingVersionChanges[versionId]) {
					incomingVersionChanges[versionId] = [];
				}
				incomingVersionChanges[versionId].push(change);
			}

			for (const [versionId, versionChanges] of Object.entries(
				incomingVersionChanges
			)) {
				const incomingChanges = await Promise.all(
					versionChanges.map(async (change) => {
						const [, changeId] = change.entity_id.split(",");
						const foundChange = allIncomingChanges.find(
							(c) => c.id === changeId
						);
						if (foundChange === undefined) {
							// TODO unclear why the fallback is needed. waiting for simplification
							// of sync before investigating further.
							//
							// Observation:
							//
							// The lix_server_url change existed on the server
							// but the client didn't send it. Maybe due to the
							// test environment in the e2e test "should sync versions".
							const fallback = await trx
								.selectFrom("change")
								.where("id", "=", changeId!)
								.selectAll()
								.executeTakeFirst();
							if (fallback) {
								return fallback;
							} else {
								throw new Error(
									"Change not found. Expected to find a change for the version change in the incoming changes."
								);
							}
						}
						return foundChange;
					})
				);
				const existingChanges: Change[] = [];

				// manually constructing the symmetric difference
				// between the incoming version and existing version
				await Promise.all(
					incomingChanges.map(async (change) => {
						const existingChange = await trx
							.selectFrom("version_change")
							.innerJoin("change", "version_change.change_id", "change.id")
							.where("version_change.version_id", "=", versionId)
							.where("change.file_id", "=", change.file_id)
							.where("change.schema_key", "=", change.schema_key)
							.where("change.entity_id", "=", change.entity_id)
							// only select the change if it differs from the incoming change
							.where("change.id", "!=", change.id)
							.selectAll("change")
							.executeTakeFirst();
						if (existingChange) {
							existingChanges.push(existingChange);
						}
					})
				);

				//! Deactivated change conflict detection.
				//!
				//! Led to foreign key bugs etc. Will be reactivated
				//! with the "conflicts" milestone
				// const detectedConflicts = await detectChangeConflicts({
				// 	lix: { ...open.lix, db: trx },
				// 	changes: [...incomingChanges, ...existingChanges],
				// });

				// for (const conflict of detectedConflicts) {
				// 	await createChangeConflict({
				// 		lix: { ...open.lix, db: trx },
				// 		key: conflict.key,
				// 		version: { id: versionId },
				// 		conflictingChangeIds: new Set(conflict.conflictingChangeIds),
				// 	});
				// }
			}

			// const allmlog = await trx
			// 	.selectFrom("mutation_log")
			// 	.selectAll()
			// 	// .select(({ fn }) => {
			// 	// 	return ["session", fn.max<number>("session_time").as("time")];
			// 	// })
			// 	// .groupBy("session")
			// 	.execute();

			// const vcAfterPush = await trx
			// 	.selectFrom("mutation_log")
			// 	.select(({ fn }) => {
			// 		return ["session", fn.max<number>("session_time").as("time")];
			// 	})
			// 	.groupBy("session")
			// 	.execute();

			// console.log(
			// 	"----------- DONE PROCESSING PUSH FROM CLIENT  ---- ---------",
			// 	vcAfterPush,
			// 	allmlog.length
			// );
		});

		await context.environment.closeLix(open);

		return new Response(null, {
			status: 201,
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				code: "FAILED_TO_INSERT_DATA",
				message: (error as any)?.message,
			} satisfies ResponseBody["400"]["content"]["application/json"]),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
};
