import type { LixPlugin } from "../plugin/lix-plugin.js";
import { Kysely, sql } from "kysely";
import { type LixDatabaseSchema } from "../database/schema.js";
import type { LixKeyValue } from "../key-value/schema-definition.js";
import { capture } from "../services/telemetry/capture.js";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import type { NewStateByVersion } from "../engine/entity-views/types.js";
import type { LixAccount } from "../account/schema-definition.js";
import { createHooks, type LixHooks } from "../hooks/create-hooks.js";
import { createObserve } from "../observe/create-observe.js";
import type { EngineEvent, LixEngine } from "../engine/boot.js";
import type { LixEnvironment } from "../environment/api.js";
import { createEnvironmentDialect } from "../database/sqlite/environment-dialect.js";
import { createDefaultPlugins } from "../database/kysely/index.js";
import { random } from "../engine/functions/random.js";
import { loadPluginFromString } from "../environment/load-from-string.js";

export type Lix = {
	db: Kysely<LixDatabaseSchema>;
	plugin: {
		getAll: () => Promise<LixPlugin[]>;
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
	 * Calls a named engine function and returns its result.
	 *
	 * Preferred entrypoint for invoking engine functions.
	 */
	call: (name: string, args?: unknown) => Promise<unknown>;

	/**
	 * Serialises the Lix into a {@link Blob}.
	 *
	 * Use this helper to persist the current state to disk or send it to a
	 * server. By convention, persisted Lix files use the `.lix` extension.
	 *
	 * @example Persist to disk in Node
	 *
	 * ```ts
	 * import { writeFile } from "node:fs/promises";
	 * const blob = await lix.toBlob();
	 * await writeFile("repo.lix", Buffer.from(await blob.arrayBuffer()));
	 * ```
	 *
	 * @example Trigger a browser download
	 *
	 * ```ts
	 * const blob = await lix.toBlob();
	 * const url = URL.createObjectURL(blob);
	 * const a = document.createElement("a");
	 * a.href = url;
	 * a.download = "repo.lix";
	 * a.click();
	 * URL.revokeObjectURL(url);
	 * ```
	 */
	toBlob: () => Promise<Blob>;

	/**
	 * In‑process engine context bound to the live database.
	 *
	 * When Lix runs in‑process (same thread as the database),
	 * `engine` is available and tests can directly call helpers
	 * that accept `{ engine }`.
	 *
	 * When Lix runs out‑of‑process (for example inside a Worker), the engine
	 * is not accessible from the main thread and will be `undefined`. In those
	 * environments, use `lix.call` to invoke engine functions across the
	 * boundary.
	 *
	 * Guidance:
	 * - Prefer `lix.db` for normal queries and `lix.call` for engine
	 *   operations. Reserve `lix.engine` for unit tests or internal SDK code
	 *   that explicitly requires in‑process access alongside the database.
	 * - Do not rely on `lix.engine` in application/business logic, since it
	 *   may be `undefined` in worker/remote environments.
	 *
	 * Unit test in the same process
	 *
	 * @example
	 *
	 * ```ts
	 * test("example test", async () => {
	 *   // InMemory environment runs in the same process (in‑process engine).
	 *   const lix = await openLix({
	 *      environment: new InMemoryenvironment()
	 *   });
	 *   executeSync({
	 *     engine: lix.engine!,
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
	engine?: LixEngine;
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

	environment?: LixEnvironment;

	/**
	 * Provide plugin instances directly (in-process environments only).
	 *
	 * Use this when executing in the same thread as the engine, e.g. tests or
	 * scripts running with {@link InMemoryEnvironment}. Plugins supplied this
	 * way are not transferable across worker boundaries.
	 *
	 * Prefer {@link providePluginsRaw} when the environment can access bundled
	 * plugin source (for example via `?raw` import). Raw strings load on the
	 * target thread and work in both workers and main-thread contexts, but are
	 * usually unavailable in unit tests.
	 *
	 * @example
	 * ```ts
	 * const lix = await openLix({
	 *   providePlugins: [jsonPlugin]
	 * })
	 * ```
	 */
	providePlugins?: LixPlugin[];

	/**
	 * Provide plugins as stringified ESM modules.
	 *
	 * This is the portable format for worker or cross-thread environments where
	 * functions cannot be structured cloned. Each string is evaluated via
	 * {@link loadPluginFromString} inside the target environment.
	 *
	 * @example
	 * ```ts
	 * const jsonPlugin = await fetch("/plugins/json.js").then((res) => res.text());
	 * const lix = await openLix({ providePluginsRaw: [jsonPlugin] });
	 * ```
	 */
	providePluginsRaw?: string[];

	/**
	 * Set the key values when opening the lix.
	 *
	 * The `lixcol_version_id` defaults to the active version.
	 *
	 * @example
	 *   const lix = await openLix({ keyValues: [{ key: "lix_sync", value: "false" }] })
	 */
	keyValues?: NewStateByVersion<LixKeyValue>[];
}): Promise<Lix> {
	const hooks = createHooks();
	const blob = args.blob;
	let engine: LixEngine | undefined;
	const hostPlugins: LixPlugin[] = [];

	const providedPluginObjects = [...(args.providePlugins ?? [])];
	const providedPluginStrings = [...(args.providePluginsRaw ?? [])];

	for (const plugin of providedPluginObjects) {
		hostPlugins.push(plugin);
	}
	for (const plugin of providedPluginStrings) {
		hostPlugins.push(await loadPluginFromString(plugin));
	}

	const environment =
		args.environment ??
		(await import("../environment/in-memory.js").then(
			(m) => new m.InMemoryEnvironment()
		))!;

	// Default behavior: openOrCreate
	// - If a blob is provided, attempt to create from it (environment may refuse if target exists)
	// - If no blob is provided, attempt to create a fresh Lix; if environment reports existing DB,
	//   fall back to open without a blob.
	const boot = {
		args: {
			providePlugins: providedPluginObjects,
			providePluginsRaw: providedPluginStrings,
			account: args.account,
			keyValues: args.keyValues,
		},
	} as const;

	if (blob) {
		await environment.create({ blob: await args.blob!.arrayBuffer() });
		const res = await environment.open({
			boot,
			emit: (ev: EngineEvent) => hooks._emit(ev.type, ev.payload),
		});
		engine = res?.engine;
	} else {
		const exists = await environment.exists();
		if (!exists) {
			const { newLixFile } = await import("./new-lix.js");
			const seed = await newLixFile({ keyValues: args.keyValues });
			const seedBytes = await seed.arrayBuffer();
			await environment.create({ blob: seedBytes });
		}
		const res = await environment.open({
			boot,
			emit: (ev: EngineEvent) => hooks._emit(ev.type, ev.payload),
		});
		engine = res?.engine;
	}

	const db = new Kysely<LixDatabaseSchema>({
		dialect: createEnvironmentDialect({ environment }),
		plugins: createDefaultPlugins(),
	});

	const observe = createObserve({ hooks });

	await captureOpened({ lix: { db, call: environment.call } });

	const lix: Lix = {
		// sqlite intentionally not exposed in environment mode
		db,
		hooks,
		observe,
		engine: engine,
		plugin: {
			getAll: async () => hostPlugins,
		},
		call: async (name: string, args?: unknown): Promise<unknown> =>
			environment.call(name, args),
		close: async () => {
			await environment.close();
		},
		toBlob: async () => {
			await environment.call("lix_commit_sequence_number");
			await environment.call("lix_commit_deterministic_rng_state");
			return new Blob([await environment.export()]);
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
