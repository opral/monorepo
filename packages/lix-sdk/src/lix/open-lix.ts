import type { LixPlugin } from "../plugin/lix-plugin.js";
import { loadPlugins } from "../plugin/load-plugin.js";
import { contentFromDatabase, type SqliteDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { initChangeQueue } from "../change-queue/init-change-queue.js";
import { changeQueueSettled } from "../change-queue/change-queue-settled.js";

export type Lix = {
	db: ReturnType<typeof initDb>;
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
	 * (-) such a file format must always be opened with the
	 *     file format sdk. the file is not portable
	 *
	 * @example
	 *   const lix = await openLixInMemory({ blob: await newLixFile(), providePlugin: [myPlugin] })
	 */
	providePlugins?: LixPlugin[];
}): Promise<Lix> {
	const db = initDb({ sqlite: args.database });

	const plugins = await loadPlugins(db);
	if (args.providePlugins && args.providePlugins.length > 0) {
		plugins.push(...args.providePlugins);
	}

	const plugin = {
		getAll: async () => plugins,
	};

	initChangeQueue({
		lix: { db, plugin },
		rawDatabase: args.database,
	});

	return {
		db,
		toBlob: async () => {
			await changeQueueSettled({ lix: { db } });
			return new Blob([contentFromDatabase(args.database)]);
		},
		plugin,
		close: async () => {
			closed = true;
			await changeQueueSettled({ lix: { db } });
			args.database.close();
			await db.destroy();
		},
	};
}
