import { expect, test } from "vitest";
import { Kysely, sql } from "kysely";
import { openLix } from "../../lix/open-lix.js";
import type { LixDatabaseSchema } from "../../database/schema.js";
import { createEngineDialect } from "../../database/sqlite/engine-dialect.js";
import { createDefaultPlugins } from "../../database/kysely/index.js";
import { createCachePopulator } from "./cache-populator.js";
import { createQueryRouter } from "./router.js";

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
				createQueryRouter(),
			],
		}),
	};
}
