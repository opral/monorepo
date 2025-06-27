import type { LixPlugin } from "../plugin/lix-plugin.js";
import { type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { sql, type Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { KeyValue } from "../key-value/schema.js";
import { capture } from "../services/telemetry/capture.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { applyFileDatabaseSchema } from "../file/schema.js";
import type { NewState } from "../entity-views/types.js";
import type { Account } from "../account/schema.js";
import { InMemoryStorage, type LixStorageAdapter } from "./storage/in-memory.js";

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
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixDatabaseSchema>;
	plugin: {
		getAll: () => Promise<LixPlugin[]>;
		getAllSync: () => LixPlugin[];
	};
};

/**
 * Opens a Lix instance.
 *
 * Creates an in-memory database by default. If a blob is provided,
 * the database is initialized with that data. If a database is provided,
 * uses that database directly.
 *
 * TODO: Add storage abstraction to support:
 *   - OPFS storage (persistent in browser)
 *   - Node.js filesystem storage
 *   - Custom storage adapters
 *
 * @example
 * ```ts
 * // In-memory (default)
 * const lix = await openLix({})
 *
 * // From existing data
 * const lix = await openLix({ blob: existingLixFile })
 *
 * // With custom database (current approach)
 * const db = await createInMemoryDatabase({ readOnly: false })
 * const lix = await openLix({ database: db })
 * ```
 */
export async function openLix(args: {
	/**
	 * The account that is opening this lix.
	 *
	 * Lix will automatically set the active account to the provided account.
	 *
	 * @example
	 *   const account = localStorage.getItem("account")
	 *   const lix = await openLix({ account })
	 */
	account?: Account;
	/**
	 * Lix file data to initialize the database with.
	 */
	blob?: Blob;
	/**
	 * Storage adapter for persisting lix data.
	 *
	 * @default InMemoryStorage
	 */
	storage?: LixStorageAdapter;
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
	 *   const lix = await openLix({ providePlugins: [myPlugin] })
	 */
	providePlugins?: LixPlugin[];
	/**
	 * Set the key values when opening the lix.
	 *
	 * @example
	 *   const lix = await openLix({ keyValues: [{ key: "lix_sync", value: "false" }] })
	 */
	keyValues?: NewState<KeyValue>[];
}): Promise<Lix> {
	const storage = args.storage ?? new InMemoryStorage();
	const database = await storage.open();

	// Import blob data if provided
	if (args.blob) {
		await storage.import(args.blob);
	}

	const db = initDb({ sqlite: database });

	if (args.keyValues && args.keyValues.length > 0) {
		for (const keyValue of args.keyValues) {
			// Check if the key already exists
			const existing = await db
				.selectFrom("key_value")
				.select("key")
				.where("key", "=", keyValue.key)
				.executeTakeFirst();

			if (existing) {
				// Update existing key
				await db
					.updateTable("key_value")
					.set({ value: keyValue.value })
					.where("key", "=", keyValue.key)
					.execute();
			} else {
				// Insert new key
				await db.insertInto("key_value").values(keyValue).execute();
			}
		}
	}

	if (args.account) {
		await db.transaction().execute(async (trx) => {
			// delete the default inserted active account from `initDb`
			await trx.deleteFrom("active_account").execute();
			await trx
				.insertInto("active_account")
				.values(args.account!)
				.onConflict((oc) => oc.doUpdateSet(() => ({ ...args.account })))
				.execute();
		});
	}

	const plugins: LixPlugin[] = [];
	if (args.providePlugins && args.providePlugins.length > 0) {
		plugins.push(...args.providePlugins);
	}

	const plugin = {
		getAll: async () => plugins,
		getAllSync: () => plugins,
	};

	// await initFileQueueProcess({ lix: { db, plugin, sqlite: args.database } });

	// await initSyncProcess({ lix: { db, plugin, sqlite: args.database } });

	captureOpened({ db });

	const lix = {
		db,
		sqlite: database,
		plugin,
	};

	// Apply file and account schemas now that we have the full lix object with plugins
	applyFileDatabaseSchema(lix);

	return lix;
}

async function captureOpened(args: { db: Kysely<LixDatabaseSchema> }) {
	try {
		const telemetry = await args.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_telemetry")
			.executeTakeFirst();

		if (telemetry?.value === "off") {
			return;
		}

		const activeAccount = await args.db
			.selectFrom("active_account")
			.select("id")
			.executeTakeFirstOrThrow();

		const lixId = await args.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_id")
			.executeTakeFirstOrThrow();

		const fileExtensions = await usedFileExtensions(args.db);
		if (Math.random() > 0.1) {
			await capture("LIX-SDK lix opened", {
				accountId: activeAccount.id,
				lixId: lixId.value as string,
				telemetryKeyValue: (telemetry?.value ?? "on") as string,
				properties: {
					lix_sdk_version: ENV_VARIABLES.LIX_SDK_VERSION,
					stored_file_extensions: fileExtensions,
				},
			});
		}
	} catch {
		// ignore
	}
}

/**
 * Get all used file extensions.
 */
export async function usedFileExtensions(
	db: Kysely<LixDatabaseSchema>
): Promise<any> {
	const result = await sql`
	WITH RECURSIVE numbers(i) AS (
		SELECT 1
		UNION ALL
		SELECT i + 1 FROM numbers WHERE i < 1000 -- Limit to 1000 characters for path length
	),
	REVERSED AS (
		SELECT id,
					GROUP_CONCAT(SUBSTR(path, LENGTH(path) - i + 1, 1), '') AS reversed_path
		FROM file, numbers
		WHERE i <= LENGTH(path)
		GROUP BY id, path
	),
	EXTENSIONS AS (
		SELECT DISTINCT SUBSTR(path, LENGTH(path) - INSTR(reversed_path, '.') + 2) AS extension
		FROM file
		JOIN REVERSED ON file.id = REVERSED.id
		WHERE INSTR(reversed_path, '.') > 0
	)
	SELECT extension FROM EXTENSIONS;
	`.execute(db);

	return result.rows.map((row) => (row as any).extension);
}
