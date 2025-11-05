import {
	DummyDriver,
	Kysely,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { createDefaultPlugins } from "../database/kysely/plugins.js";

/**
 * Cold Kysely instance wired to the SQLite dialect for compiling queries against
 * the internal schema without holding a live database connection.
 *
 * Pair this with `engine.executeSync` when you need synchronous access to
 * internal views:
 *
 * @example
 * ```ts
 * const [config] = engine.executeSync(
 *   internalQueryBuilder
 *     .selectFrom("lix_internal_state_vtable")
 *     .where("entity_id", "=", "lix_deterministic_mode")
 *     .where("schema_key", "=", "lix_key_value")
 *     .where("snapshot_content", "is not", null)
 *     .select(
 *       sql`json_extract(snapshot_content, '$.value.nano_id')`.as("nano_id")
 *     )
 *     .compile()
 * ).rows;
 * ```
 */
export const internalQueryBuilder: Kysely<LixInternalDatabaseSchema> =
	new Kysely({
		dialect: {
			createAdapter: () => new SqliteAdapter(),
			createDriver: () => new DummyDriver(),
			createIntrospector: (db) => new SqliteIntrospector(db),
			createQueryCompiler: () => new SqliteQueryCompiler(),
		},
		plugins: [...createDefaultPlugins()],
	});
