import { promises as fs } from "fs";
import { describe, expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";
import { selectVersionDiff } from "./select-version-diff.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

const OUTPUT_PATH = decodeURIComponent(
	new URL("./select-version-diff.playground-plan.txt", import.meta.url).pathname
);

describe("selectVersionDiff playground", () => {
	test("captures explain output", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const benchDiffSchema = {
			"x-lix-key": "test_bench_diff_entity",
			"x-lix-version": "1.0",
			type: "object",
			additionalProperties: false,
			properties: {
				v: {
					anyOf: [{ type: "string" }, { type: "number" }],
				},
			},
		} as const satisfies LixSchemaDefinition;

		try {
			await lix.db
				.insertInto("stored_schema")
				.values({ value: benchDiffSchema })
				.execute();

			const source = await createVersion({ lix, name: "play_source" });
			const target = await createVersion({ lix, name: "play_target" });

			await Promise.all([
				lix.db
					.insertInto("state_by_version")
					.values({
						entity_id: "created_1",
						schema_key: "test_bench_diff_entity",
						file_id: "bench_file",
						version_id: source.id,
						plugin_key: "bench_plugin",
						snapshot_content: { v: 1 },
						schema_version: "1.0",
					})
					.execute(),
				lix.db
					.insertInto("state_by_version")
					.values({
						entity_id: "deleted_1",
						schema_key: "test_bench_diff_entity",
						file_id: "bench_file",
						version_id: target.id,
						plugin_key: "bench_plugin",
						snapshot_content: { v: 2 },
						schema_version: "1.0",
					})
					.execute(),
				(async () => {
					await lix.db
						.insertInto("state_by_version")
						.values({
							entity_id: "updated_1",
							schema_key: "test_bench_diff_entity",
							file_id: "bench_file",
							version_id: target.id,
							plugin_key: "bench_plugin",
							snapshot_content: { v: "old" },
							schema_version: "1.0",
						})
						.execute();
					await lix.db
						.insertInto("state_by_version")
						.values({
							entity_id: "updated_1",
							schema_key: "test_bench_diff_entity",
							file_id: "bench_file",
							version_id: source.id,
							plugin_key: "bench_plugin",
							snapshot_content: { v: "new" },
							schema_version: "1.0",
						})
						.execute();
				})(),
			]);

			const qb = selectVersionDiff({
				lix,
				source: { id: source.id },
				target: { id: target.id },
			}).where("diff.status", "!=", "unchanged");

			const compiled = qb.compile();
			const report = (await lix.call("lix_explain_query", {
				sql: compiled.sql,
				parameters: compiled.parameters ?? [],
			})) as {
				originalSql: string;
				rewrittenSql?: string;
				plan: unknown;
			};

			const payload = [
				"-- original SQL --",
				report.originalSql,
				"\n-- rewritten SQL --",
				report.rewrittenSql ?? "<unchanged>",
				"\n-- plan --",
				JSON.stringify(report.plan, null, 2),
			].join("\n");

			await fs.writeFile(OUTPUT_PATH, payload, "utf8");
			expect(report.plan).toBeDefined();
		} finally {
			await lix.close();
		}
	});
});
