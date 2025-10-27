import type { SqliteWasmDatabase } from "../database/sqlite/index.js";
import { prepareEngineDatabase } from "../database/init-db.js";
import { createHooks, type StateCommitChange } from "../hooks/create-hooks.js";
import { applyFilesystemSchema } from "../filesystem/schema.js";
import { loadPluginFromString } from "../environment/load-from-string.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import type { Call } from "./functions/function-registry.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import type { openLix } from "../lix/open-lix.js";
import { createExecuteSync } from "./execute-sync.js";
import { createQueryPreprocessor } from "./query-preprocessor/create-query-preprocessor.js";
import type { QueryPreprocessorFn } from "./query-preprocessor/create-query-preprocessor.js";
import { internalQueryBuilder } from "./internal-query-builder.js";
import { setDeterministicBoot } from "./deterministic-mode/is-deterministic-mode.js";
import {
	createFunctionRegistry,
	type FunctionRegistry,
} from "./functions/function-registry.js";
import { registerBuiltinFunctions } from "./functions/register-builtins.js";

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
	/** Query preprocessor shared across executeSync + explain flows */
	preprocessQuery: QueryPreprocessorFn;
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
	executeSync: (args: {
		sql: string;
		parameters?: Readonly<unknown[]>;
		bypassPreprocessor?: boolean;
	}) => {
		rows: any[];
	};
	/** Invoke an engine function (router) */
	call: Call;
	/**
	 * Register a new engine helper function.
	 *
	 * Prefer registering helpers during engine boot so they are available to
	 * both SQL rewrites and application-level calls.
	 */
	registerFunction: FunctionRegistry["register"];
	/** Enumerate registered engine helper functions. */
	listFunctions: FunctionRegistry["list"];
};

export async function boot(env: BootEnv): Promise<LixEngine> {
	const deterministicBoot = env.args.keyValues?.some(
		(kv) =>
			kv.key === "lix_deterministic_mode" &&
			kv.value !== undefined &&
			typeof kv.value === "object" &&
			(kv.value as any)?.enabled == true
	);

	const hooks = createHooks();
	const runtimeCacheRef = {};

	const engine: LixEngine = {
		sqlite: env.sqlite,
		hooks,
		getAllPluginsSync: () => plugins,
		runtimeCacheRef,
		preprocessQuery: () => {
			throw new Error("preprocessQuery() is not yet initialised");
		},
		executeSync: () => {
			throw new Error("executeSync() is not yet initialised");
		},
		call: async () => {
			throw new Error("call() is not yet initialised");
		},
		registerFunction: () => {
			throw new Error("registerFunction() is not yet initialised");
		},
		listFunctions: () => {
			throw new Error("listFunctions() is not yet initialised");
		},
	};

	const fnRegistry = createFunctionRegistry({
		engine,
	});

	engine.registerFunction = fnRegistry.register;
	engine.listFunctions = fnRegistry.list;
	engine.call = fnRegistry.call;

	if (deterministicBoot) {
		setDeterministicBoot({ runtimeCacheRef, value: true });
	}

	engine.preprocessQuery = createQueryPreprocessor(engine);

	engine.executeSync = createExecuteSync({ engine });

	prepareEngineDatabase({ engine });

	const plugins: LixPlugin[] = [];
	for (const code of env.args.providePluginsRaw ?? []) {
		const plugin = await loadPluginFromString(code);
		plugins.push(plugin);
	}
	for (const input of env.args.providePlugins ?? []) {
		plugins.push(input);
	}

	applyFilesystemSchema({ engine });

	hooks.onStateCommit(({ changes }) => {
		env.emit({ type: "state_commit", payload: { changes } });
	});

	if (env.args.account) {
		const accountExists =
			engine.executeSync(
				internalQueryBuilder
					.selectFrom("account_all")
					.select("id")
					.where("id", "=", env.args.account.id)
					.where("lixcol_version_id", "=", "global")
					.limit(1)
					.compile()
			).rows.length > 0;
		if (!accountExists) {
			engine.executeSync(
				internalQueryBuilder
					.insertInto("account_all")
					.values({
						id: env.args.account.id,
						name: env.args.account.name,
						lixcol_version_id: "global",
					})
					.compile()
			);
		}
		engine.executeSync(
			internalQueryBuilder.deleteFrom("active_account").compile()
		);
		engine.executeSync(
			internalQueryBuilder
				.insertInto("active_account")
				.values({ account_id: env.args.account.id })
				.compile()
		);
	}

	if (env.args.keyValues && env.args.keyValues.length > 0) {
		for (const kv of env.args.keyValues) {
			const explicitVid = kv.lixcol_version_id;
			if (explicitVid) {
				const exists =
					engine.executeSync(
						internalQueryBuilder
							.selectFrom("key_value_all")
							.select("key")
							.where("key", "=", kv.key)
							.where("lixcol_version_id", "=", explicitVid)
							.limit(1)
							.compile()
					).rows.length > 0;
				if (exists) {
					engine.executeSync(
						internalQueryBuilder
							.updateTable("key_value_all")
							.set({ value: kv.value as any })
							.where("key", "=", kv.key)
							.where("lixcol_version_id", "=", explicitVid)
							.compile()
					);
				} else {
					engine.executeSync(
						internalQueryBuilder
							.insertInto("key_value_all")
							.values({
								key: kv.key,
								value: kv.value as any,
								lixcol_version_id: explicitVid,
							})
							.compile()
					);
				}
			} else {
				const exists =
					engine.executeSync(
						internalQueryBuilder
							.selectFrom("key_value")
							.select("key")
							.where("key", "=", kv.key)
							.limit(1)
							.compile()
					).rows.length > 0;
				if (exists) {
					engine.executeSync(
						internalQueryBuilder
							.updateTable("key_value")
							.set({ value: kv.value as any })
							.where("key", "=", kv.key)
							.compile()
					);
				} else {
					engine.executeSync(
						internalQueryBuilder
							.insertInto("key_value")
							.values({
								key: kv.key,
								value: kv.value as any,
							})
							.compile()
					);
				}
			}
		}
	}

	registerBuiltinFunctions({ register: fnRegistry.register, engine });

	if (deterministicBoot) {
		setDeterministicBoot({ runtimeCacheRef, value: false });
	}

	return engine;
}
