import type { LixPlugin } from "../plugin/lix-plugin.js";
import { loadPlugins } from "../plugin/load-plugin.js";
import { contentFromDatabase, type SqliteDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { initChangeQueue } from "../change-queue/init-change-queue.js";
import { changeQueueSettled } from "../change-queue/change-queue-settled.js";
import type { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { initSyncProcess } from "../sync/init-sync-process.js";

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
	toBlob: () => Promise<Blob>;
	plugin: {
		getAll: () => Promise<LixPlugin[]>;
	};
	close: () => Promise<void>;
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
	 * Whether or not sync is enabled.
	 */
	sync?: boolean;
}): Promise<Lix> {
	const withDefaults = {
		sync: true,
		...args,
	};

	const db = initDb({ sqlite: args.database });

	const plugins = await loadPlugins(db);
	if (args.providePlugins && args.providePlugins.length > 0) {
		plugins.push(...args.providePlugins);
	}

	const plugin = {
		getAll: async () => plugins,
	};

	initChangeQueue({
		lix: { db, plugin, sqlite: args.database },
		rawDatabase: args.database,
	});

	if (withDefaults.sync) {
		initSyncProcess({ lix: { db, plugin } });
	}

	return {
		db,
		sqlite: args.database,
		toBlob: async () => {
			await changeQueueSettled({ lix: { db } });
			return new Blob([contentFromDatabase(args.database)]);
		},
		plugin,
		close: async () => {
			await changeQueueSettled({ lix: { db } });
			args.database.close();
			await db.destroy();
		},
	};
}
