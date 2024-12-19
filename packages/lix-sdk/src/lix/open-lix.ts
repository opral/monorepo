import type { LixPlugin } from "../plugin/lix-plugin.js";
import { loadPlugins } from "../plugin/load-plugin.js";
import { type SqliteDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { initFileQueueProcess } from "../file-queue/file-queue-process.js";
import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { initSyncProcess } from "../sync/sync-process.js";
import type { NewKeyValue } from "../key-value/database-schema.js";

export type Lix = {
	/**
	 * The raw SQLite instance.
	 *
	 * Required for advanced use cases that can't be
	 * expressed with the db API.
	 *
	 * Use with caution, automatic transformation of
	 * results like parsing json (similar to the db API)
	 * is not guaranteed.
	 */
	sqlite: SqliteDatabase;
	db: Kysely<LixDatabaseSchema>;
	plugin: {
		getAll: () => Promise<LixPlugin[]>;
	};
};

/**
 * Common setup between different lix environments.
 */
export async function openLix(args: {
	database: SqliteDatabase;
	/**
	 * Usecase are lix apps that define their own file format,
	 * like inlang (unlike a markdown, csv, or json plugin).
	 *
	 * (+) avoids separating app code from plugin code and
	 *     resulting bundling logic.
	 *
	 * (-) such a file format must always be opened with the
	 *     file format sdk. the file is not portable
	 *
	 * @example
	 *   const lix = await openLixInMemory({ providePlugins: [myPlugin] })
	 */
	providePlugins?: LixPlugin[];
	/**
	 * Set the key values when opening the lix.
	 *
	 * @example
	 *   const lix = await openLix({ keyValues: [{ key: "lix_sync", value: "false" }] })
	 */
	keyValues?: NewKeyValue[];
}): Promise<Lix> {
	const db = initDb({ sqlite: args.database });

	if (args.keyValues && args.keyValues.length > 0) {
		await db
			.insertInto("key_value")
			.values(args.keyValues)
			.onConflict((oc) =>
				oc.doUpdateSet((eb) => ({ value: eb.ref("excluded.value") }))
			)
			.execute();
	}

	const plugins = await loadPlugins(db);
	if (args.providePlugins && args.providePlugins.length > 0) {
		plugins.push(...args.providePlugins);
	}

	const plugin = {
		getAll: async () => plugins,
	};

	initFileQueueProcess({ lix: { db, plugin, sqlite: args.database } });

	initSyncProcess({ lix: { db, plugin, sqlite: args.database } });

	return {
		db,
		sqlite: args.database,
		plugin,
	};
}
