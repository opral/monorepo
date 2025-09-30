import { describe, expect, test, vi } from "vitest";
import { sql } from "kysely";
import { internalQueryBuilder } from "./internal-query-builder.js";
import { newLixFile } from "../lix/new-lix.js";
import { openLix } from "../lix/open-lix.js";
import { withRuntimeCache } from "./with-runtime-cache.js";

describe("withRuntimeCache", () => {
	test("caches executeSync results per runtimeCacheRef", async () => {
		const lix = await openLix({ blob: await newLixFile() });
		const engine = lix.engine!;
		const compiled = internalQueryBuilder
			.selectFrom("internal_state_reader")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			)
			.limit(1)
			.compile();

		const executeSpy = vi.spyOn(engine, "executeSync");

		const first = withRuntimeCache(engine, compiled);
		const second = withRuntimeCache(engine, compiled);

		expect(first.rows).toEqual(second.rows);
		expect(executeSpy).toHaveBeenCalledTimes(1);

		executeSpy.mockRestore();
		await lix.close();
	});

	test("invalidates cache when dependent state changes", async () => {
		const lix = await openLix({ blob: await newLixFile() });
		const engine = lix.engine!;
		const compiled = internalQueryBuilder
			.selectFrom("internal_state_reader")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			)
			.limit(1)
			.compile();

		const executeSpy = vi.spyOn(engine, "executeSync");

		withRuntimeCache(engine, compiled);
		expect(executeSpy).toHaveBeenCalledTimes(1);

		engine.hooks._emit("state_commit", {
			changes: [
				{
					id: "change-1",
					entity_id: "lix_deterministic_mode",
					schema_key: "lix_key_value",
					schema_version: "1",
					file_id: "lix",
					plugin_key: "test",
					created_at: new Date().toISOString(),
					snapshot_content: null,
					version_id: "global",
					commit_id: "commit-1",
					writer_key: null,
				},
			],
		});

		withRuntimeCache(engine, compiled);

		expect(executeSpy).toHaveBeenCalledTimes(2);

		executeSpy.mockRestore();
		await lix.close();
	});

	test("ignores unrelated state changes", async () => {
		const lix = await openLix({ blob: await newLixFile() });
		const engine = lix.engine!;
		const compiled = internalQueryBuilder
			.selectFrom("internal_state_reader")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			)
			.limit(1)
			.compile();

		const executeSpy = vi.spyOn(engine, "executeSync");

		withRuntimeCache(engine, compiled);
		expect(executeSpy).toHaveBeenCalledTimes(1);

		engine.hooks._emit("state_commit", {
			changes: [
				{
					id: "change-2",
					entity_id: "some_other_config",
					schema_key: "lix_key_value",
					schema_version: "1",
					file_id: "lix",
					plugin_key: "test",
					created_at: new Date().toISOString(),
					snapshot_content: null,
					version_id: "global",
					commit_id: "commit-2",
					writer_key: null,
				},
			],
		});

		withRuntimeCache(engine, compiled);

		expect(executeSpy).toHaveBeenCalledTimes(1);

		executeSpy.mockRestore();
		await lix.close();
	});

	test("scopes cache per engine instance", async () => {
		const lixA = await openLix({ blob: await newLixFile() });
		const lixB = await openLix({ blob: await newLixFile() });
		const engineA = lixA.engine!;
		const engineB = lixB.engine!;
		const compiled = internalQueryBuilder
			.selectFrom("internal_state_reader")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.select(
				sql`json_extract(snapshot_content, '$.value.enabled')`.as("enabled")
			)
			.limit(1)
			.compile();

		const spyA = vi.spyOn(engineA, "executeSync");
		const spyB = vi.spyOn(engineB, "executeSync");

		withRuntimeCache(engineA, compiled);
		withRuntimeCache(engineB, compiled);

		expect(spyA).toHaveBeenCalledTimes(1);
		expect(spyB).toHaveBeenCalledTimes(1);

		withRuntimeCache(engineA, compiled);
		withRuntimeCache(engineB, compiled);

		expect(spyA).toHaveBeenCalledTimes(1);
		expect(spyB).toHaveBeenCalledTimes(1);

		spyA.mockRestore();
		spyB.mockRestore();
		await lixA.close();
		await lixB.close();
	});
});
