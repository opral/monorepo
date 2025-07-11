import type { LixPlugin } from "../plugin/lix-plugin.js";
import { type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { sql, type Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixKeyValue } from "../key-value/schema.js";
import { capture } from "../services/telemetry/capture.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { applyFileDatabaseSchema } from "../file/schema.js";
import type { NewState } from "../entity-views/types.js";
import type { LixAccount } from "../account/schema.js";
import { InMemoryStorage } from "./storage/in-memory.js";
import type { LixStorageAdapter } from "./storage/lix-storage-adapter.js";
import { createHooks, type LixHooks } from "../hooks/create-hooks.js";
import { createObserve } from "../observe/create-observe.js";
import { enableQueryLogging, cleanupQueryLogging } from "../database/enable-query-logging.js";

export type Lix = {
	skipLogging?: boolean;
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
	/**
	 * Hooks for listening to database lifecycle events.
	 *
	 * Allows registering callbacks that fire at specific points
	 * in Lix's execution, such as when state changes are committed.
	 */
	hooks: LixHooks;
	/**
	 * Closes the lix instance and its storage.
	 */
	close: () => Promise<void>;
	observe: ReturnType<typeof createObserve>;
	/**
	 * Serialises the Lix into a {@link Blob}.
	 *
	 * Use this helper to persist the current state to disk or send it to a
	 * server. The blob contains the raw SQLite file representing the Lix
	 * project.
	 *
	 * @example
	 * ```ts
	 * const blob = await lix.toBlob()
	 * download(blob)
	 * ```
	 */
	toBlob: () => Promise<Blob>;
};

/**
 * Opens a Lix instance.
 *
 * Creates an in-memory database by default. If a blob is provided,
 * the database is initialized with that data. If a database is provided,
 * uses that database directly.
 *
 * @example
 * ```ts
 * // In-memory (default)
 * const lix = await openLix({})
 *
 * // From existing data
 * const lix = await openLix({ blob: existingLixFile })
 *
 * // With custom storage adapter
 * import { MyCustomStorage } from "./my-custom-storage.js"
 * const lix = await openLix({
 *   storage: new MyCustomStorage()
 * })
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
	account?: LixAccount;
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
	keyValues?: NewState<LixKeyValue>[];
}): Promise<Lix> {
	const storage = args.storage ?? (new InMemoryStorage() as LixStorageAdapter);
	const database = await storage.open();

	// Import blob data if provided
	if (args.blob) {
		await storage.import(args.blob);
	}

	// Create hooks before initializing database so they can be used in schema setup
	const hooks = createHooks();

	const db = initDb({ sqlite: database, hooks });

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

	// Check if storage has persisted state
	const persistedState = await storage.getPersistedState?.();
	const accountToSet = args.account ?? persistedState?.activeAccounts?.[0];

	if (accountToSet) {
		await db.transaction().execute(async (trx) => {
			// delete the existing active account
			await trx.deleteFrom("active_account").execute();
			await trx.insertInto("active_account").values(accountToSet).execute();
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

	captureOpened({ db });

	const observe = createObserve({ hooks });

	const lix = {
		db,
		sqlite: database,
		plugin,
		hooks,
		observe,
		close: async () => {
			// Clean up query logging timeouts before closing
			cleanupQueryLogging();
			await storage.close();
		},
		toBlob: async () => {
			return storage.export();
		},
	};

	// Apply file and account schemas now that we have the full lix object with plugins
	applyFileDatabaseSchema(lix);

	// Enable query logging (can be configured via environment or options)
	enableQueryLogging(lix, {
		enabled: true,
		logSlowQueriesOnly: false,
	});

	// Connect storage to Lix if the adapter supports it
	if (storage.connect) {
		storage.connect({ lix });
	}

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
