import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { Kysely } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import { initDb } from "../database/init-db.js";
import { createHooks, type StateCommitChange } from "../hooks/create-hooks.js";
import { applyFileDatabaseSchema } from "../file/schema.js";
import { loadPluginFromString } from "../environment/load-from-string.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { switchAccount } from "../account/switch-account.js";
import { createEngineRouter, type Call } from "./router.js";
import type { LixHooks } from "../hooks/create-hooks.js";
import type { openLix } from "../lix/open-lix.js";

export type EngineEvent = {
	type: "state_commit";
	payload: { changes: StateCommitChange[] };
};

export type BootArgs = {
	pluginsRaw?: Parameters<typeof openLix>[0]["pluginsRaw"];
	providePlugins?: Parameters<typeof openLix>[0]["providePlugins"];
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
	db: Kysely<LixDatabaseSchema>;
	hooks: LixHooks;
	/** Return all loaded plugins synchronously */
	getAllPluginsSync: () => LixPlugin[];
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
export async function boot(
	env: BootEnv
): Promise<{ engine: LixEngine; call: Call }> {
	const hooks = createHooks();
	const db = initDb({ sqlite: env.sqlite, hooks });

	// Load plugins from raw ESM strings and provided plugin objects
	const plugins: LixPlugin[] = [];
	for (const code of env.args.pluginsRaw ?? []) {
		const p = await loadPluginFromString(code);
		plugins.push(p);
	}
	for (const p of env.args.providePlugins ?? []) {
		plugins.push(p);
	}

	const plugin = {
		getAll: async () => plugins,
		getAllSync: () => plugins,
	};

	// Build a local Lix-like context for schema that needs plugin/hooks
	const engine: LixEngine = {
		sqlite: env.sqlite,
		db,
		hooks,
		getAllPluginsSync: () => plugin.getAllSync(),
	};

	// Install file functions + views that depend on plugin + hooks
	applyFileDatabaseSchema({ engine: engine });

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

	/**
	 * TODO(opral): Boot-time vtable priming to avoid cold-start write rollbacks.
	 *
	 * Why this is needed now:
	 * - The first entity write (INSERT into a view like key_value) triggers the vtable's write path
	 *   which runs validation. Validation reads from internal_resolved_state_all to fetch schemas and
	 *   enforce constraints. That SELECT hits the vtable's xFilter.
	 * - On a cold database, xFilter detects a stale cache and attempts to populate/mark-fresh the
	 *   cache. That population writes to cache tables. Performing writes from within a vtable write
	 *   callback (xUpdate -> SELECT -> xFilter -> populate) causes SQLite to abort with
	 *   SQLITE_ABORT_ROLLBACK.
	 * - The classic opener (openLix) happens to perform early reads (telemetry, active account, lix_id)
	 *   which prime the vtable/cache before user writes, avoiding the issue. openLixBackend did not,
	 *   so the first write could hit this cold-start condition and abort.
	 *
	 * Temporary mitigation:
	 * - Perform a harmless read that goes through vtable-backed views after boot, but before user
	 *   writes. This ensures cache population occurs outside any write transaction.
	 *
	 * Future improvements to remove this priming:
	 * 1) Guard xFilter during write-in-progress to avoid populate/mark-fresh from xFilter when
	 *    called within xUpdate. Return empty results for resolved-state reads from within writes.
	 * 2) Adjust validation (e.g., getStoredSchema) to avoid internal_resolved_state_all in the write
	 *    path, reading from materializer/change tables instead to prevent invoking xFilter.
	 * 3) Proactively populate cache (or mark as fresh) at boot using dedicated routines which are
	 *    safe outside vtable callbacks.
	 */
	try {
		await db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirst();
		await db
			.selectFrom("state_all")
			.select((eb) => eb.fn.countAll().as("c"))
			.executeTakeFirst();
	} catch {
		// non-fatal
	}

	const { call } = createEngineRouter({ engine: engine });
	return { engine: engine, call };
}
