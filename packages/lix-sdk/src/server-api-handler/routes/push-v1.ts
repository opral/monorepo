import type * as LixServerApi from "@lix-js/server-api-schema";
import type { LixServerApiHandlerRoute } from "../create-server-api-handler.js";
import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import type { Lix } from "../../lix/open-lix.js";
import { mergeTheirState } from "../../sync/merge-state.js";
import type { Change } from "../../database/schema.js";
import { detectChangeConflicts } from "../../change-conflict/detect-change-conflicts.js";
import { createChangeConflict } from "../../change-conflict/create-change-conflict.js";
import { CompiledQuery } from "kysely";

type RequestBody =
	LixServerApi.paths["/lsa/push-v1"]["post"]["requestBody"]["content"]["application/json"];

type ResponseBody = LixServerApi.paths["/lsa/push-v1"]["post"]["responses"];

export const route: LixServerApiHandlerRoute = async (context) => {
	const body = (await context.request.json()) as RequestBody;
	const blob = await context.storage.get(`lix-file-${body.lix_id}`);

	if (!blob) {
		return new Response(null, { status: 404 });
	}

	let lix: Lix;

	try {
		lix = await openLixInMemory({ blob, sync: false });
	} catch {
		return new Response(
			JSON.stringify({
				code: "INVALID_LIX_FILE",
				message: "The lix file couldn't be opened.",
			} satisfies ResponseBody["500"]["content"]["application/json"]),
			{
				status: 500,
			}
		);
	}

	try {
		// console.log(
		// 	"----------- PROCESSING PUSH FROM CLIENT  --s----------- with state:",
		// 	body.vector_clock
		// );

		await lix.db.transaction().execute(async (trx) => {
			await trx.executeQuery(
				CompiledQuery.raw("PRAGMA defer_foreign_keys = ON;")
			);

			await mergeTheirState({
				lix: { ...lix, db: trx },
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
				const incomingChanges = versionChanges.map((change) => {
					const [, changeId] = change.entity_id.split(",");
					const foundChange = allIncomingChanges.find((c) => c.id === changeId);
					if (foundChange === undefined) {
						throw new Error(
							"Change not found. Expected to find a change for the version change in the incoming changes."
						);
					}
					return foundChange;
				});
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

				const detectedConflicts = await detectChangeConflicts({
					lix: { ...lix, db: trx },
					changes: [...incomingChanges, ...existingChanges],
				});

				for (const conflict of detectedConflicts) {
					await createChangeConflict({
						lix: { ...lix, db: trx },
						key: conflict.key,
						version: { id: versionId },
						conflictingChangeIds: new Set(conflict.conflictingChangeIds),
					});
				}
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

		await context.storage.set(`lix-file-${body.lix_id}`, await lix.toBlob());

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
