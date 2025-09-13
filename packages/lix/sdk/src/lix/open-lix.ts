import type { LixPlugin } from "../plugin/lix-plugin.js";
import { type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { Kysely, ParseJSONResultsPlugin, sql } from "kysely";
import {
	LixSchemaViewMap,
	type LixDatabaseSchema,
} from "../database/schema.js";
import type { LixKeyValue } from "../key-value/schema.js";
import { capture } from "../services/telemetry/capture.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import type { NewStateAll } from "../entity-views/types.js";
import type { LixAccount } from "../account/schema.js";
import { createHooks, type LixHooks } from "../hooks/create-hooks.js";
import { createObserve } from "../observe/create-observe.js";
import type { LixRuntime } from "../runtime/boot.js";
import type { LixBackend } from "../backend/types.js";
import { isJsonType } from "../schema-definition/json-type.js";
import { createDialect } from "../backend/kysely/kysely-driver.js";
import { JSONColumnPlugin } from "../database/kysely-plugin/json-column-plugin.js";
import { ViewInsertReturningErrorPlugin } from "../database/kysely-plugin/view-insert-returning-error-plugin.js";
import { random } from "../runtime/deterministic/random.js";

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
	sqlite?: SqliteWasmDatabase;
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
	 * Calls a named runtime function and returns its result.
	 *
	 * Preferred entrypoint for invoking runtime functions.
	 */
	call: (
		name: string,
		payload?: unknown,
		opts?: { signal?: AbortSignal }
	) => Promise<unknown>;

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

	/**
	 * In‑process runtime context bound to the live database.
	 *
	 * When Lix runs in‑process (same thread as the database),
	 * `runtime` is available and tests can directly call helpers
	 * that accept `{ runtime }`.
	 *
	 * When Lix runs out‑of‑process (for example inside a Worker), the runtime
	 * is not accessible from the main thread and will be `undefined`. In those
	 * environments, use `lix.call` to invoke runtime functions across the
	 * boundary.
	 *
	 * Guidance:
	 * - Prefer `lix.db` for normal queries and `lix.call` for runtime
	 *   operations. Reserve `lix.runtime` for unit tests or internal SDK code
	 *   that explicitly requires in‑process access alongside the database.
	 * - Do not rely on `lix.runtime` in application/business logic, since it
	 *   may be `undefined` in worker/remote environments.
	 *
	 * Unit test in the same process
	 *
	 * @example
	 *
	 * ```ts
	 * test("example test", async () => {
	 *   // InMemory backend runs in the same process (in‑process engine).
	 *   const lix = await openLix({
	 *      backend: new InMemoryBackend()
	 *   });
	 *   executeSync({
	 *     runtime: lix.runtime!,
	 *     data: [...],
	 *   });
	 * });
	 * ```
	 *
	 * Worker/remote environment – prefer router calls
	 *
	 * @example
	 * ```ts
	 * await lix.call("lix_insert_transaction_state", { timestamp, data });
	 * ```
	 */
	runtime?: LixRuntime;
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

	backend?: LixBackend;

	pluginsRaw?: string[];
	/**
	 * Provide plugin instances directly (classic API).
	 *
	 * Supported only by in‑process backends. In worker/remote backends,
	 * plugins must be provided via `pluginsRaw` (stringified ESM modules).
	 */
	providePlugins?: LixPlugin[];

	/**
	 * Set the key values when opening the lix.
	 *
	 * The `lixcol_version_id` defaults to the active version.
	 *
	 * @example
	 *   const lix = await openLix({ keyValues: [{ key: "lix_sync", value: "false" }] })
	 */
	keyValues?: NewStateAll<LixKeyValue>[];
}): Promise<Lix> {
	const hooks = createHooks();
	const blob = args.blob;
	let runtime: LixRuntime | undefined;

	const backend =
		args.backend ??
		(await import("../backend/in-memory.js").then(
			(m) => new m.InMemoryBackend()
		))!;

	// Default behavior: openOrCreate
	// - If a blob is provided, attempt to create from it (backend may refuse if target exists)
	// - If no blob is provided, attempt to create a fresh Lix; if backend reports existing DB,
	//   fall back to open without a blob.
	const boot = {
		args: {
			pluginsRaw: args.pluginsRaw,
			providePlugins: args.providePlugins,
			account: args.account,
			keyValues: args.keyValues,
		},
	} as const;

	if (blob) {
		await backend.create({
			blob: await args.blob!.arrayBuffer(),
			boot,
			onEvent: (ev) => hooks._emit(ev.type, ev.payload),
		});
		const res = await backend.open({
			boot,
			onEvent: (ev) => hooks._emit(ev.type, ev.payload),
		});
		runtime = res?.runtime;
	} else {
		// Exists-first flow: avoid throwing to decide; ask backend if a DB exists.
		const exists = await backend.exists();
		if (!exists) {
			const { newLixFile } = await import("./new-lix.js");
			const seed = await newLixFile({ keyValues: args.keyValues });
			const seedBytes = await seed.arrayBuffer();
			await backend.create({
				blob: seedBytes,
				boot,
				onEvent: (ev) => hooks._emit(ev.type, ev.payload),
			});
		}
		const res = await backend.open({
			boot,
			onEvent: (ev) => hooks._emit(ev.type, ev.payload),
		});
		runtime = res?.runtime;
	}

	// Build JSON column mapping to match openLix() parsing behavior
	const ViewsWithJsonColumns = (() => {
		const result: Record<string, Record<string, { type: any }>> = {};

		// Hardcoded object-only columns
		const hardcodedViews: Record<string, Record<string, { type: any }>> = {
			state: { snapshot_content: { type: "object" } },
			state_all: { snapshot_content: { type: "object" } },
			state_history: { snapshot_content: { type: "object" } },
			change: { snapshot_content: { type: "object" } },
		};
		Object.assign(result, hardcodedViews);

		for (const [viewName, schema] of Object.entries(LixSchemaViewMap)) {
			if (typeof schema === "boolean" || !schema.properties) continue;
			const jsonColumns: Record<string, { type: any }> = {};
			for (const [key, def] of Object.entries(schema.properties)) {
				if (isJsonType(def)) {
					jsonColumns[key] = {
						type: ["string", "number", "boolean", "object", "array", "null"],
					};
				}
			}
			if (Object.keys(jsonColumns).length > 0) {
				result[viewName] = jsonColumns;
				result[viewName + "_all"] = jsonColumns;
			}
		}
		return result;
	})();

	const db = new Kysely<LixDatabaseSchema>({
		dialect: createDialect({ backend: backend }),
		plugins: [
			new ParseJSONResultsPlugin(),
			JSONColumnPlugin(ViewsWithJsonColumns),
			new ViewInsertReturningErrorPlugin(Object.keys(LixSchemaViewMap)),
		],
	});

	const observe = createObserve({ hooks });

	await captureOpened({ lix: { db, call: backend.call } });

	const lix: Lix = {
		// sqlite intentionally not exposed in backend mode
		db,
		hooks,
		observe,
		runtime,
		plugin: {
			getAll: async () => runtime?.getAllPluginsSync() ?? [],
			getAllSync: () => runtime?.getAllPluginsSync() ?? [],
		},
		call: async (
			name: string,
			payload?: unknown,
			_opts?: { signal?: AbortSignal }
		): Promise<unknown> => backend.call(name, payload),
		close: async () => {
			await backend.close();
		},
		toBlob: async () => {
			await backend.call("lix_commit_sequence_number");
			await backend.call("lix_commit_deterministic_rng_state");
			return new Blob([await backend.export()]);
		},
	};

	return lix;
}

async function captureOpened(args: { lix: Pick<Lix, "db" | "call"> }) {
	try {
		const telemetry = await args.lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_telemetry")
			.executeTakeFirst();

		if (telemetry?.value === "off") {
			return;
		}

		const activeAccount = await args.lix.db
			.selectFrom("active_account")
			.select("account_id")
			.executeTakeFirstOrThrow();

		const lixId = await args.lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_id")
			.executeTakeFirstOrThrow();

		const fileExtensions = await usedFileExtensions(args.lix.db);
		const sample = await random({ lix: args.lix });
		if (sample > 0.1) {
			// Not awaiting to avoid boot up time and knowing that
			// no database query is performed here. we dont care if the
			// server responds with an error or not.
			void capture("LIX-SDK lix opened", {
				accountId: activeAccount.account_id,
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
