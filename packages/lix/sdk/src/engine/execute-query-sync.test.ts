import { sql } from "kysely";
import { expect, test } from "vitest";

import { createInMemoryDatabase } from "../database/sqlite/create-in-memory-database.js";
import { createExecuteQuerySync } from "./execute-query-sync.js";
import { internalQueryBuilder } from "./internal-query-builder.js";
import { createHooks } from "../hooks/create-hooks.js";
import { createExecuteSync } from "./execute-sync.js";
import { openLix } from "../lix/open-lix.js";
import { markStateCacheAsStale } from "../state/cache/mark-state-cache-as-stale.js";
import { isStaleStateCache } from "../state/cache/is-stale-state-cache.js";

test("executeQuerySync executes a compiled raw query", async () => {
	const sqlite = await createInMemoryDatabase({});
	const engine = {
		sqlite,
		hooks: createHooks(),
		runtimeCacheRef: {},
		executeSync: createExecuteSync({ sqlite }),
	};
	const executeQuerySync = createExecuteQuerySync({ engine });

	const compiled = sql<{ value: number }>`select 1 as value`.compile(
		internalQueryBuilder
	);

	const { rows } = executeQuerySync(compiled);

	expect(rows).toHaveLength(1);
	expect(rows[0]).toEqual({ value: 1 });
});

test("executeQuerySync executes compiled builder queries", async () => {
	const sqlite = await createInMemoryDatabase({});
	sqlite.exec({
		sql: "create table key_value (key text primary key, value integer)",
	});
	sqlite.exec({
		sql: "insert into key_value(key, value) values ('answer', 42)",
	});
	const engine = {
		sqlite,
		hooks: createHooks(),
		runtimeCacheRef: {},
		executeSync: createExecuteSync({ sqlite }),
	};

	const executeQuerySync = createExecuteQuerySync({ engine });

	const compiled = internalQueryBuilder
		.selectFrom("key_value")
		.select("value")
		.where("key", "=", "answer")
		.compile();

	const { rows } = executeQuerySync(compiled);

	expect(rows).toEqual([{ value: 42 }]);
});

test("executeQuerySync warms state cache via cache populator", async () => {
	const lix = await openLix({});
	const engine = lix.engine!;

	await lix.db
		.insertInto("key_value")
		.values({ key: "cache_test", value: "value" })
		.execute();

	markStateCacheAsStale({ engine });
	expect(isStaleStateCache({ engine })).toBe(true);

	const executeQuerySync = createExecuteQuerySync({ engine });

	const compiled = lix.db
		.selectFrom("state_all")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", "cache_test")
		.selectAll()
		.compile();

	executeQuerySync(compiled);

	expect(isStaleStateCache({ engine })).toBe(false);
});
