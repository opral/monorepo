import {
	DummyDriver,
	Kysely,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { createDefaultPlugins } from "../database/index.js";

/**
 * Cold Kysely instance wired to the SQLite dialect for compiling queries against
 * the internal schema without holding a live database connection.
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
