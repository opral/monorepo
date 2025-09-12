import { Kysely, ParseJSONResultsPlugin } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixBackend } from "../backend/types.js";
import { createDialect } from "../backend/kysely/kysely-driver.js";
import { createHooks } from "../hooks/create-hooks.js";
import { createObserve } from "../observe/create-observe.js";
import { JSONColumnPlugin } from "../database/kysely-plugin/json-column-plugin.js";
import { LixSchemaViewMap } from "../database/schema.js";
import { isJsonType } from "../schema-definition/json-type.js";
import type { LixRuntime } from "../runtime/boot.js";

/**
 * Experimental: Open a Lix-like instance backed by a LixBackend.
 *
 * This variant does not initialize the Lix database schema. It assumes the
 * engine was initialized with an existing database blob (or takes
 * responsibility for schema creation on its own). It provides a Kysely DB
 * connection and helpers to export/close.
 *
 * For full Lix behavior (schema, vtable, hooks), use the classic openLix()
 * until the schema initialization is available inside the engine.
 */
export async function openLixBackend(args: {
	backend: LixBackend;
	blob?: ArrayBuffer;
	pluginsRaw: string[];
	account?: { id: string; name: string };
	keyValues?: Array<{ key: string; value: any; lixcol_version_id?: string }>;
}): Promise<{
	db: Kysely<LixDatabaseSchema>;
	hooks: ReturnType<typeof createHooks>;
	observe: ReturnType<typeof createObserve>;
	/**
	 * Main‑thread runtime if provided by the backend. In in‑process setups (e.g.,
	 * InMemory backend), this may be defined and can be used in unit tests. For
	 * worker/remote backends, this will be undefined; prefer `call()` in those
	 * environments.
	 */
	runtime?: LixRuntime;
	/**
	 * Minimal runtime call boundary for worker-backed engines.
	 *
	 * Uses the backend's worker call transport.
	 */
	call: (
		name: string,
		payload?: unknown,
		opts?: { signal?: AbortSignal }
	) => Promise<unknown>;
	close: () => Promise<void>;
	toBlob: () => Promise<Blob>;
}> {
	const hooks = createHooks();
	const blob = args.blob;
	let runtime: LixRuntime | undefined;

	// Default behavior: openOrCreate
	// - If a blob is provided, attempt to create from it (backend may refuse if target exists)
	// - If no blob is provided, attempt to create a fresh Lix; if backend reports existing DB,
	//   fall back to open without a blob.
	const boot = {
		args: {
			pluginsRaw: args.pluginsRaw,
			account: args.account,
			keyValues: args.keyValues,
		},
	} as const;

	if (blob) {
		await args.backend.create({
			blob,
			boot,
			onEvent: (ev) => hooks._emit(ev.type, ev.payload),
		});
		const res = await args.backend.open({
			boot,
			onEvent: (ev) => hooks._emit(ev.type, ev.payload),
		});
		runtime = res?.runtime;
	} else {
		// Exists-first flow: avoid throwing to decide; ask backend if a DB exists.
		const exists = await args.backend.exists();
		if (!exists) {
			const { newLixFile } = await import("./new-lix.js");
			const seed = await newLixFile({ keyValues: args.keyValues });
			const seedBytes = await seed.arrayBuffer();
			await args.backend.create({
				blob: seedBytes,
				boot,
				onEvent: (ev) => hooks._emit(ev.type, ev.payload),
			});
		}
		const res = await args.backend.open({
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
		dialect: createDialect({ backend: args.backend }),
		plugins: [
			new ParseJSONResultsPlugin(),
			JSONColumnPlugin(ViewsWithJsonColumns),
		],
	});

	const observe = createObserve({ hooks });

	return {
		db,
		hooks,
		observe,
		runtime,
		call: async (
			name: string,
			payload?: unknown,
			_opts?: { signal?: AbortSignal }
		): Promise<unknown> => {
			return args.backend.call(name, payload);
		},
		close: async () => {
			await args.backend.close();
		},
		toBlob: async () => {
			return new Blob([await args.backend.export()]);
		},
	};
}

// Temporary alias for backwards compatibility while migrating terminology.
// (no alias)
