import type { CompiledQuery } from "kysely";
import type { SqliteWasmDatabase } from "../database/sqlite/index.js";
import { initDb } from "../database/init-db.js";
import { createHooks, type StateCommitChange } from "../hooks/create-hooks.js";
import { applyFilesystemSchema } from "../filesystem/schema.js";
import { loadPluginFromString } from "../environment/load-from-string.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { switchAccount } from "../account/switch-account.js";
import { createCallRouter, type Call } from "./functions/router.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import type { openLix } from "../lix/open-lix.js";
import { createExecuteSync } from "./execute-sync.js";
import { createExecuteQuerySync } from "./execute-query-sync.js";

export type EngineEvent = {
	type: "state_commit";
	payload: { changes: StateCommitChange[] };
};

export type BootArgs = {
	providePlugins?: LixPlugin[];
	providePluginsRaw?: string[];
	account?: Parameters<typeof openLix>[0]["account"];
	keyValues?: Parameters<typeof openLix>[0]["keyValues"];
};

export type BootEnv = {
	sqlite: SqliteWasmDatabase;
	emit: (ev: EngineEvent) => void;
	args: BootArgs;
};

/**
 * Engine context bound to a live SQLite connection.
 *
 * Internal to the engine: used by deterministic helpers and the engine
 * function router. Not exposed as a value to app code, but the type is
 * exported for internal module boundaries.
 */
// Engine context bound to a live SQLite connection. Internal only.
export type LixEngine = {
	sqlite: SqliteWasmDatabase;
	hooks: LixHooks;
	/** Return all loaded plugins synchronously */
	getAllPluginsSync: () => LixPlugin[];
	/**
	 * Stable runtime-only cache token.
	 *
	 * Each engine instance gets a unique object that survives for the lifetime of
	 * the engine. Use it when you need to memoise values in a WeakMap without
	 * holding on to the whole engine:
	 *
	 * @example
	 * ```ts
	 * const rngState = new WeakMap<object, RngState>();
	 *
	 * function randomSync(engine: LixEngine) {
	 *   let state = rngState.get(engine.runtimeCacheRef);
	 *   if (!state) {
	 *     state = seedRng();
	 *     rngState.set(engine.runtimeCacheRef, state);
	 *   }
	 *   return state.next();
	 * }
	 * ```
	 */
	runtimeCacheRef: object;
	/** Execute raw SQL synchronously against the engine-controlled SQLite connection */
	executeSync: (args: { sql: string; parameters?: Readonly<unknown[]> }) => {
		rows: any[];
	};
	/**
	 * Run a compiled Kysely query through the engine’s query compiler and execute it synchronously.
	 */
	executeQuerySync: (args: { query: CompiledQuery<unknown> }) => {
		rows: any[];
	};
	/** Invoke an engine function (router) */
	call: Call;
};

/**
 * Boot the Lix engine next to a live SQLite connection.
 *
 * - Applies schema, vtable, UDFs via initDb
 * - Installs file handlers and views
 * - Loads plugins from stringified ESM modules
 * - Optionally seeds account and key-values
 * - Bridges state_commit events to the host via emit
 */
export async function boot(env: BootEnv): Promise<LixEngine> {
	const hooks = createHooks();
	const runtimeCacheRef = {};
	const executeSync = createExecuteSync({ sqlite: env.sqlite });
	const db = initDb({
		sqlite: env.sqlite,
		hooks,
		executeSync,
		runtimeCacheRef,
	});

	// Load plugins from raw ESM strings and provided plugin objects
	const plugins: LixPlugin[] = [];
	for (const code of env.args.providePluginsRaw ?? []) {
		const plugin = await loadPluginFromString(code);
		plugins.push(plugin);
	}
	for (const input of env.args.providePlugins ?? []) {
		plugins.push(input);
	}

	// Build a local Lix-like context for schema that needs plugin/hooks
	const engineBase = {
		sqlite: env.sqlite,
		hooks,
		getAllPluginsSync: () => plugins,
		runtimeCacheRef,
		executeSync,
		executeQuerySync: undefined as unknown as LixEngine["executeQuerySync"],
		call: async () => {
			throw new Error("Engine router not initialised");
		},
	};

	const executeQuerySync = createExecuteQuerySync({ engine: engineBase });
	engineBase.executeQuerySync = executeQuerySync;

	const engine = engineBase as LixEngine;

	// Install filesystem functions + views that depend on plugin + hooks
	applyFilesystemSchema({ engine });

	// Event bridge: forward state_commit to host
	hooks.onStateCommit(({ changes }) => {
		env.emit({ type: "state_commit", payload: { changes } });
	});

	// Optional: ensure account exists and set as active
	if (env.args.account) {
		const existing = await db
			.selectFrom("account_all")
			.where("id", "=", env.args.account.id)
			.where("lixcol_version_id", "=", "global")
			.select("id")
			.executeTakeFirst();
		if (!existing) {
			await db
				.insertInto("account_all")
				.values({
					id: env.args.account.id,
					name: env.args.account.name,
					lixcol_version_id: "global",
				})
				.execute();
		}
		await switchAccount({ lix: { db }, to: [env.args.account] });
	}

	// Optional: seed/override key values
	if (env.args.keyValues && env.args.keyValues.length > 0) {
		for (const kv of env.args.keyValues) {
			const explicitVid = kv.lixcol_version_id;
			if (explicitVid) {
				const exists = await db
					.selectFrom("key_value_all")
					.select("key")
					.where("key", "=", kv.key)
					.where("lixcol_version_id", "=", explicitVid)
					.executeTakeFirst();
				if (exists) {
					await db
						.updateTable("key_value_all")
						.set({ value: kv.value as any })
						.where("key", "=", kv.key)
						.where("lixcol_version_id", "=", explicitVid)
						.execute();
				} else {
					await db
						.insertInto("key_value_all")
						.values({
							key: kv.key,
							value: kv.value as any,
							lixcol_version_id: explicitVid,
						})
						.execute();
				}
			} else {
				const exists = await db
					.selectFrom("key_value")
					.select("key")
					.where("key", "=", kv.key)
					.executeTakeFirst();
				if (exists) {
					await db
						.updateTable("key_value")
						.set({ value: kv.value as any })
						.where("key", "=", kv.key)
						.execute();
				} else {
					await db
						.insertInto("key_value")
						.values({ key: kv.key, value: kv.value as any })
						.execute();
				}
			}
		}
	}

	const { call } = createCallRouter({ engine });
	engine.call = call;
	return engine;
}
