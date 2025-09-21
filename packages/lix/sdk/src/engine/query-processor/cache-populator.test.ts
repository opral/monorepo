import { expect, test } from "vitest";
import { Kysely, sql } from "kysely";
import { openLix } from "../../lix/open-lix.js";
import { createEngineDialect } from "../../database/sqlite/engine-dialect.js";
import { createDefaultPlugins } from "../../database/kysely/index.js";
import type { LixDatabaseSchema } from "../../database/schema.js";
import { markStateCacheAsStale } from "../../state/cache/mark-state-cache-as-stale.js";
import { isStaleStateCache } from "../../state/cache/is-stale-state-cache.js";
import { clearStateCache } from "../../state/cache/clear-state-cache.js";
import { createCachePopulator } from "./cache-populator.js";

test("warms the state cache when the stale flag is set", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;

	markStateCacheAsStale({ engine });
	expect(isStaleStateCache({ engine })).toBe(true);

	const testDb = new Kysely<LixDatabaseSchema>({
		dialect: createEngineDialect({ database: engine.sqlite }),
		plugins: [...createDefaultPlugins(), createCachePopulator({ engine })],
	});

	await testDb
		.selectFrom("state_all")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(isStaleStateCache({ engine })).toBe(false);
});

test("state query repopulates the physical cache table", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;

	await lix.db
		.insertInto("key_value")
		.values({ key: "kv_test", value: "value" })
		.execute();

	clearStateCache({ engine });

	const testDb = new Kysely<LixDatabaseSchema>({
		dialect: createEngineDialect({ database: engine.sqlite }),
		plugins: [...createDefaultPlugins(), createCachePopulator({ engine })],
	});

	const { rows: before } = await sql<{ count: number }>`
		SELECT COUNT(*) as count
		FROM internal_state_cache_lix_key_value
		WHERE version_id = ${"global"}
	`.execute(testDb);

	expect(before[0]?.count ?? 0).toBe(0);

	await testDb
		.selectFrom("state_all")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "kv_test")
		.selectAll()
		.execute();

	const { rows: after } = await sql<{ count: number }>`
		SELECT COUNT(*) as count
		FROM internal_state_cache_lix_key_value
		WHERE version_id = ${"global"}
	`.execute(testDb);

	expect(after[0]?.count ?? 0).toBeGreaterThan(0);
});

test("skips repopulation when cache is already fresh", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;

	await lix.db
		.insertInto("key_value")
		.values({ key: "kv_fresh", value: "value" })
		.execute();

	expect(isStaleStateCache({ engine })).toBe(false);

	const testDb = new Kysely<LixDatabaseSchema>({
		dialect: createEngineDialect({ database: engine.sqlite }),
		plugins: [...createDefaultPlugins(), createCachePopulator({ engine })],
	});

	const { rows: before } = await sql<{ count: number }>`
		SELECT COUNT(*) as count
		FROM internal_state_cache_lix_key_value
		WHERE version_id = ${"global"}
	`.execute(testDb);

	await testDb
		.selectFrom("state_all")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "kv_fresh")
		.selectAll()
		.execute();

	const { rows: after } = await sql<{ count: number }>`
		SELECT COUNT(*) as count
		FROM internal_state_cache_lix_key_value
		WHERE version_id = ${"global"}
	`.execute(testDb);

	expect(isStaleStateCache({ engine })).toBe(false);
	expect(after[0]?.count ?? 0).toBe(before[0]?.count ?? 0);
});
