import { test } from "vitest";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";
import { createVersion } from "./create-version.js";

test("simulation test discovery", () => {});

simulationTest(
	"version pointer materialization is deterministic across simulations",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create a new version from the current global tip
		const v = await createVersion({ lix, name: "ptr-mat" });

		// 1) Version view pointer (global view)
		const verRow = await lix.db
			.selectFrom("version")
			.where("id", "=", v.id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// 2) Version tips from materializer
		const tips =
			(lix.sqlite.exec({
				sql: `SELECT version_id, tip_commit_id FROM internal_materialization_version_tips WHERE version_id = ?`,
				bind: [v.id],
				rowMode: "object",
				returnValue: "resultRows",
			}) as Array<{ version_id: string; tip_commit_id: string }>) ?? [];
		expectDeterministic(tips.length).toBe(1);
		// Version view pointer must match the materializer tip for that version
		expectDeterministic(verRow.commit_id).toBe(tips[0]!.tip_commit_id);

		// 3) What the materializer exposes for lix_version (inspect for differences)
		const matRows =
			(lix.sqlite.exec({
				sql: `SELECT version_id, entity_id, json_extract(snapshot_content,'$.commit_id') AS commit_id
            FROM internal_state_materializer
            WHERE schema_key = 'lix_version' AND entity_id = ?
            ORDER BY version_id`,
				bind: [v.id],
				rowMode: "object",
				returnValue: "resultRows",
			}) as Array<{
				version_id: string;
				entity_id: string;
				commit_id: string | null;
			}>) ?? [];
		expectDeterministic(matRows).toEqual(matRows); // compares across simulations

		// 4) State cache (if exists) for lix_version
		const cacheTableExists = lix.sqlite.exec({
			sql: `SELECT 1 FROM sqlite_schema WHERE type='table' AND name='internal_state_cache_lix_version'`,
			rowMode: "array",
			returnValue: "resultRows",
		}) as any[];
		if (cacheTableExists?.length) {
			const cacheRows =
				(lix.sqlite.exec({
					sql: `SELECT version_id, entity_id, json_extract(snapshot_content,'$.commit_id') AS commit_id
              FROM internal_state_cache_lix_version WHERE entity_id = ? ORDER BY version_id`,
					bind: [v.id],
					rowMode: "object",
					returnValue: "resultRows",
				}) as Array<{
					version_id: string;
					entity_id: string;
					commit_id: string | null;
				}>) ?? [];
			expectDeterministic(cacheRows).toEqual(cacheRows);
		}
	}
);
