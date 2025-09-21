import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixEngine } from "../engine/boot.js";
import { executeSync } from "../database/execute-sync.js";
import { internalQueryBuilder } from "../engine/internal-query-builder.js";

/**
 * Build synchronous, Kysely-compatible SELECT queries for plugins.
 *
 * Why this exists
 * - Plugin `detectChanges()` often needs to read current state to preserve
 *   stable entity ids, compare snapshots, or infer ordering without reparsing
 *   files. A convenient, typed query builder helps keep that logic concise.
 * - The Lix engine may run in a separate thread/process relative to app code.
 *   SQLite itself executes queries synchronously; when the engine hosts
 *   `detectChanges()`, it cannot await asynchronous calls out to the app
 *   thread. `querySync` lets plugins build Kysely queries and execute them
 *   synchronously inside the engine via `executeSync`.
 *
 * How it works
 * - Returns a Kysely-like builder starting from `selectFrom(table)`.
 *   All the usual chaining methods work; only the final `.execute()` and
 *   helpers run synchronously.
 * - JSON parsing: to match normal Kysely behavior, `snapshot_content` is
 *   parsed to an object. Other JSON-typed columns are returned as raw JSON
 *   strings (consistent with `executeSync`); parse manually if needed.
 *
 * @example
 * // Inside a plugin's detectChanges
 * detectChanges: ({ after, querySync }) => {
 *   const rows = querySync("state")
 *     .where("file_id", "=", after.id)
 *     .select(["entity_id", "schema_key", "snapshot_content"])
 *     .execute(); // sync result array
 *
 *   const latestById = new Map(rows.map(r => [r.entity_id, r]));
 *   // ... use latestById to emit changes with stable entity ids ...
 *   return []
 * }
 */
export type QuerySyncFunction = <
	Table extends keyof LixDatabaseSchema & string,
>(
	table: Table
) => any;

/**
 * Create a synchronous query builder factory bound to an engine.
 *
 * Returns a `querySync(table)` function that mirrors Kysely's
 * `selectFrom(table)` builder, but with synchronous execution via
 * `.execute()`, `.executeTakeFirst()`, and `.executeTakeFirstOrThrow()`.
 *
 * When to use
 * - Inside plugins: pass the returned `querySync` into `detectChanges()` so
 *   plugins can read current state synchronously while computing changes.
 * - In unit tests: construct `querySync` from an in‑process Lix (e.g.
 *   `InMemoryEnvironment`) using `createQuerySync({ engine: lix.engine! })`
 *   and call your plugin's `detectChanges({ querySync, ... })` directly.
 *
 * Engine availability
 * - In in‑process environments (like the default in‑memory environment),
 *   `lix.engine` is available and can be passed here.
 * - In worker/remote environments, `lix.engine` is undefined on the host
 *   thread. In those cases, use integration tests that drive the file
 *   handlers or a test environment that exposes the engine.
 *
 * JSON behavior
 * - `snapshot_content` is parsed to objects to match normal Kysely queries.
 *   Other JSON columns are returned as raw JSON strings; parse if needed.
 *
 * @example
 * // Unit testing a plugin's detectChanges directly
 * import { openLix, createQuerySync } from '@lix-js/sdk'
 * import { detectChanges } from '../src/detect-changes.js'
 *
 * const lix = await openLix({})
 * const querySync = createQuerySync({ engine: lix.engine! })
 *
 * const after = {
 *   id: 'file1',
 *   path: '/doc.md',
 *   data: new TextEncoder().encode('# Hello'),
 *   metadata: {}
 * }
 *
 * const changes = detectChanges({ querySync, after })
 * expect(Array.isArray(changes)).toBe(true)
 */
export function createQuerySync(args: {
	engine: Pick<LixEngine, "sqlite">;
}): QuerySyncFunction {
	/**
	 * Starts a SELECT from the given table and returns a Kysely builder
	 * whose `.execute()` runs synchronously.
	 */
	function querySync<Table extends keyof LixDatabaseSchema & string>(
		table: Table
	): any {
		const base = internalQueryBuilder.selectFrom(table) as any;
		return wrapBuilder(base, args.engine);
	}

	return querySync;
}

function wrapBuilder<T extends object>(
	builder: T,
	engine: Pick<LixEngine, "sqlite">
): any {
	return new Proxy(builder as any, {
		get(target, prop, _receiver) {
			if (prop === "execute") {
				return () => parseSnapshotRows(executeSync({ engine, query: target }));
			}
			if (prop === "executeTakeFirst") {
				return () => {
					const rows = parseSnapshotRows(
						executeSync({ engine, query: target })
					);
					return rows[0] ?? undefined;
				};
			}
			if (prop === "executeTakeFirstOrThrow") {
				return () => {
					const rows = parseSnapshotRows(
						executeSync({ engine, query: target })
					);
					if (!rows[0]) throw new Error("No result");
					return rows[0];
				};
			}

			const value = target[prop];
			if (typeof value === "function") {
				return (...args: any[]) => {
					const res = value.apply(target, args);
					// If the method returns another builder (typical in Kysely),
					// wrap it again to keep `.execute()` synchronous.
					if (
						res &&
						typeof res === "object" &&
						typeof res.compile === "function"
					) {
						return wrapBuilder(res, engine);
					}
					return res;
				};
			}
			return value;
		},
	});
}

function parseSnapshotRows(rows: Array<any>): Array<any> {
	return rows.map((r) => {
		if (r && typeof r === "object" && "snapshot_content" in r) {
			const v = (r as any).snapshot_content;
			if (typeof v === "string") {
				try {
					return { ...r, snapshot_content: JSON.parse(v) };
				} catch {
					// fall through if not valid JSON
				}
			}
		}
		return r;
	});
}

export type QuerySync = QuerySyncFunction;
