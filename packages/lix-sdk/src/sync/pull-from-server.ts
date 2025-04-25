// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { Lix } from "../lix/open-lix.js";
import type * as LixServerProtocol from "../../../lix/server-protocol-schema/dist/schema.js";
import { mergeTheirState, type VectorClock } from "./merge-state.js";
import { applyChanges } from "../change/apply-changes.js";
import type { Change } from "../database/schema.js";
import { CompiledQuery } from "kysely";

export async function pullFromServer(args: {
	id: string;
	lix: Pick<Lix, "db" | "plugin">;
	serverUrl: string;
}): Promise<VectorClock> {
	// 1. get the current vector clock on the client "sessionStatesKnownByTheClient" and send it to the server
	const sessionStatesClient = await args.lix.db
		.selectFrom("mutation_log")
		.select(({ fn }) => {
			return ["session", fn.max<number>("session_time").as("time")];
		})
		.groupBy("session")
		.execute();

	// 2. query the state from the server using the clients vector clock
	const response = await fetch(
		new Request(`${args.serverUrl}/lsp/pull-v1`, {
			method: "POST",
			body: JSON.stringify({
				lix_id: args.id,
				vector_clock: sessionStatesClient,
			} satisfies LixServerProtocol.paths["/lsp/pull-v1"]["post"]["requestBody"]["content"]["application/json"]),
			headers: {
				"Content-Type": "application/json",
			},
		})
	);
	if (response.ok === false) {
		try {
			const body = await response.json();
			throw new Error(
				`Failed to pull from server: ${body.code} ${body.message}`
			);
		} catch {
			throw new Error(
				`Failed to pull from server: ${response.status} ${response.statusText}`
			);
		}
	}
	const body = await response.json();

	// 3. Client receives the data (added/changed rows + vector clock) from the server
	//   - client could have moved forward in the meantime!
	const data = (
		body as LixServerProtocol.paths["/lsp/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"]
	).data;

	const sessionStateServer = (
		body as LixServerProtocol.paths["/lsp/pull-v1"]["post"]["responses"]["200"]["content"]["application/json"]
	).vector_clock;

	const changes = (data["change"] ?? []) as Change[];

	await args.lix.db.transaction().execute(async (trx) => {
		await trx.executeQuery(
			CompiledQuery.raw("PRAGMA defer_foreign_keys = ON;")
		);

		const currentVersion = await trx
			.selectFrom("current_version")
			.select("id")
			.executeTakeFirstOrThrow();

		/**
		 * The version change (pointers) need to be applied to the version_change table.
		 *
		 * Without the version change pointers, switching between versiond and
		 * seeing "what changes are in this version" would not be possible.
		 */
		const versionChanges: Change[] = [];

		/**
		 * The version change conflict (pointers) need to be applied as well for
		 * the same reason as applying version changes is necessary.
		 *
		 * Without the pointers, conflicts are not copied over.
		 */
		const versionChangeConflicts: Change[] = [];

		/**
		 * The changes that are part of the current version must all get applied.
		 */
		const changesInCurrentVersion: Change[] = [];

		for (const change of changes) {
			if (
				change.schema_key === "lix_version_change_table" ||
				change.schema_key === "lix_version_change_conflict_table"
			) {
				const [versionId] = change.entity_id.split(",") as [string, string];
				if (change.schema_key === "lix_version_change_table") {
					if (versionId === currentVersion.id) {
						// the version change pointer of the current version updated.
						// finding a matching change in the changes array
						// and pushing it to the changesInCurrentVersion array
						// to be applied in the next step.
						const [, changeId] = change.entity_id.split(",");
						// the find operation can be expensive. to be optimized later.
						const matchingChange = changes.find((c) => c.id === changeId!);
						if (!matchingChange) {
							throw new Error("Expected matching change");
						}
						changesInCurrentVersion.push(matchingChange);
					}
					// in any case, push the version change to the version changes array
					versionChanges.push(change);
				} else if (change.schema_key === "lix_version_change_conflict_table") {
					versionChangeConflicts.push(change);
				} else {
					throw new Error("Unexpected schema key");
				}
			}
		}

		// potential optimization by not creating a new array with immutability (spreading)
		const changesToApply = [
			...versionChanges,
			...versionChangeConflicts,
			...changesInCurrentVersion,
		];

		await mergeTheirState({
			lix: { ...args.lix, db: trx },
			sourceVectorClock: sessionStateServer,
			sourceData: data,
		});

		if (changesToApply.length > 0) {
			await applyChanges({
				lix: { ...args.lix, db: trx },
				changes: changesToApply,
			});
		}
	});

	return sessionStateServer;
}
