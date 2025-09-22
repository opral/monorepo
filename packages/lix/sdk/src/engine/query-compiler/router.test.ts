import { expect, test } from "vitest";
import { Kysely, sql } from "kysely";
import { openLix } from "../../lix/open-lix.js";
import type { LixDatabaseSchema } from "../../database/schema.js";
import { createEngineDialect } from "../../database/sqlite/engine-dialect.js";
import { createDefaultPlugins } from "../../database/kysely/index.js";
import { createCachePopulator } from "./cache-populator.js";
import { createStateRouter } from "./router.js";

async function createTestDb() {
	const lix = await openLix({});
	const engine = lix.engine!;

	return {
		engine,
		db: new Kysely<LixDatabaseSchema>({
			dialect: createEngineDialect({ database: engine.sqlite }),
			plugins: [
				...createDefaultPlugins(),
				createCachePopulator({ engine }),
				createStateRouter(),
			],
		}),
	};
}

test("routes state view reads to per-schema cache tables", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state as s")
		.selectAll()
		.where("s.schema_key", "=", "lix_key_value");

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).not.toContain('FROM "state"');
	expect(compiled.sql).toContain("active_version");
});

test("routes state view without alias", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state")
		.selectAll()
		.where("schema_key", "=", "lix_key_value");

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).not.toContain('FROM "state"');
});

test("routes state_all view reads to per-schema cache tables", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state_all as sa")
		.selectAll()
		.where("sa.schema_key", "=", "lix_key_value");

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).not.toContain('FROM "state_all"');
	expect(compiled.sql).toMatch(/c\.version_id/);
	expect(compiled.sql).toContain("inheritance_delete_marker = 0");
	expect(compiled.sql).not.toContain("active_version");
});

test("routes state_with_tombstones view reads to per-schema cache tables", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state_with_tombstones as swt")
		.selectAll()
		.where("swt.schema_key", "=", "lix_key_value");

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).not.toContain('FROM "state_with_tombstones"');
	expect(compiled.sql).not.toContain("inheritance_delete_marker = 0");
	expect(compiled.sql).toContain("CASE WHEN c.snapshot_content IS NULL");
});

test("preserves table aliases and projections after routing", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state as st")
		.select(["st.entity_id as id", "st.schema_key as schema"])
		.where("st.schema_key", "=", "lix_key_value");

	const compiled = query.compile();
	expect(compiled.sql).toContain('AS "st"');
	expect(compiled.sql).toContain('"st"."schema_key" = ?');
});

test("skips routing when query references unsupported tables or expressions", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state as s")
		.selectAll()
		.where("s.schema_key", "in", ["lix_key_value", "lix_other"]);

	const compiled = query.compile();
	expect(compiled.sql).toMatch(/from "state"/i);
	expect(compiled.sql).not.toContain("internal_state_cache_lix_key_value");
});

test("handles join queries where a state view participates with other tables", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state as s")
		.innerJoin("change as c", "c.id", "s.change_id")
		.select(["s.entity_id", "c.id as change_id"])
		.where("s.schema_key", "=", "lix_key_value");

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).toMatch(/join "change" as "c"/i);
	expect(compiled.sql).toContain('"c"."id" = "s"."change_id"');
});

test("routes multiple state aliases to their respective cache tables", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state as a")
		.innerJoin("state as b", "b.entity_id", "a.entity_id")
		.select(["a.entity_id", "b.change_id as change_id"])
		.where("a.schema_key", "=", "lix_key_value")
		.where("b.schema_key", "=", "lix_version_tip");

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).toContain("internal_state_cache_lix_version_tip");
	expect(compiled.sql).not.toContain('FROM "state" AS "a"');
	expect(compiled.sql).not.toContain('FROM "state" AS "b"');
});

test("preserves JSON expression filters", async () => {
	const { db } = await createTestDb();

	const query = db
		.selectFrom("state as s")
		.selectAll()
		.where("s.schema_key", "=", "lix_key_value")
		.where(
			sql`
				json_extract(${sql.ref("s.snapshot_content")}, '$.foo') = ${"bar"}
			` as any
		);

	const compiled = query.compile();
	expect(compiled.sql).toContain("internal_state_cache_lix_key_value");
	expect(compiled.sql).toMatch(/json_extract\("s"\."snapshot_content"/i);
});
