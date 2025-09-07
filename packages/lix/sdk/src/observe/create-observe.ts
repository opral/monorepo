import type { SelectQueryBuilder } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import { LixObservable } from "./lix-observable.js";
import {
	determineSchemaKeys,
	extractLiteralFilters,
} from "./determine-schema-keys.js";
import type { Change } from "../change/index.js";

/**
 * Options for the observe method.
 */
export interface ObserveOptions {
	mode?: "array" | "first" | "firstOrThrow";
}

/**
 * Map to track active observables and their cleanup functions.
 */
interface ActiveObservable {
	unsubscribeFromStateCommit: () => void;
}

/**
 * Deep equality check for query results.
 * Compares arrays element by element using JSON.stringify for simplicity.
 */
function areResultsEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false;

	// Simple deep equality using JSON.stringify
	// This works well for database results which are typically JSON-serializable
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Creates the observe function for a Lix instance.
 *
 * @param lix - The Lix instance to add observables to
 * @returns The observe function
 */
export function createObserve(lix: Pick<Lix, "hooks">) {
	const activeObservables = new WeakMap<LixObservable<any>, ActiveObservable>();

	// Pool observables per compiled SQL + params + mode so identical observe()
	// calls share a single upstream execution and state-commit subscription.
	const pool = new Map<string, LixObservable<any>>();

	/**
	 * Converts a Kysely read-query into a LixObservable – an implementation of
	 * the TC-39 Observable protocol that emits a fresh result-set whenever the
	 * underlying state mutates.
	 *
	 * Pooling:
	 * - Identical queries (same compiled SQL + parameters + mode) on the same Lix instance
	 *   return the same observable instance and share a single upstream execution and
	 *   state-commit listener.
	 * - Pooling is scoped per Lix instance. Different Lix instances never share pooling.
	 * - Different modes ("array" vs "first"/"firstOrThrow") do not pool with each other.
	 * - The pooled observable remains active until the last subscriber unsubscribes; then
	 *   the upstream is torn down and the pool entry is evicted.
	 *
	 * @example Full table stream
	 * ```ts
	 * const obs = observe(lix.db.selectFrom('key_value').selectAll())
	 * const a = obs.subscribe({ next: rows => console.log('A', rows.length) })
	 * const b = obs.subscribe({ next: rows => console.log('B', rows.length) })
	 * // Both subscribers share one upstream execution
	 * a.unsubscribe(); b.unsubscribe();
	 * ```
	 *
	 * @example Watch latest change-set (first row)
	 * ```ts
	 * observe(
	 *   lix.db.selectFrom('change_set_all')
	 *         .selectAll()
	 *         .orderBy('created_at desc')
	 * ).subscribeTakeFirst({ next: cs => console.log('head →', cs) })
	 * ```
	 */
	return function observe<T>(
		query: SelectQueryBuilder<any, any, T>,
		options: ObserveOptions = { mode: "array" }
	): LixObservable<T> {
		// Build a stable pooling key based on compiled SQL, parameters and mode
		const compiled = query.compile();
		const mode = options.mode ?? "array";
		const poolKey = `${mode}:${compiled.sql}:${JSON.stringify(compiled.parameters)}`;

		// If an observable already exists for this key, return it
		const existing = pool.get(poolKey) as LixObservable<T> | undefined;
		if (existing) return existing;

		// Create pooled observable with shared upstream and listeners
		type PooledObserver<U> = {
			next?: (value: U[]) => void;
			error?: (err: any) => void;
			complete?: () => void;
		};
		const listeners = new Set<PooledObserver<T>>();
		let isActive = false;
		let previousResult: T[] | undefined;
		let unsubscribeFromStateCommit: (() => void) | undefined;

		const notifyNext = (rows: T[]) => {
			for (const l of listeners) l.next?.(rows);
		};
		const notifyError = (err: any) => {
			for (const l of listeners) l.error?.(err);
		};

		// Helper to execute the query
		const executeQuery = async () => {
			if (!isActive) return;
			try {
				// Optimize query for first/firstOrThrow modes when executing
				let optimizedQuery = query;
				if (mode === "first" || mode === "firstOrThrow") {
					optimizedQuery = query.limit(1) as any;
				}
				const result = await optimizedQuery.execute();
				if (!isActive) return;
				const rows = result as T[];
				const changed =
					!previousResult || !areResultsEqual(previousResult, rows);
				if (changed) {
					previousResult = rows;
					notifyNext(rows);
				}
			} catch (error) {
				if (!isActive) return;
				notifyError(error);
			}
		};

		const shouldReexecute = (data: { changes: Change[] }) => {
			// Extract changes from the data structure
			const changes = data.changes || [];

			// If no changes provided, always re-execute for safety
			if (!changes || changes.length === 0) {
				return true;
			}

			// Get schema keys that this query depends on
			const recompiled = query.compile();
			const schemaKeys = determineSchemaKeys(recompiled);
			const filters = extractLiteralFilters(recompiled);
			const watchedVersions = new Set(filters.versionIds);

			// If no schema keys extracted, always re-execute for safety
			if (!schemaKeys.length) {
				return true;
			}

			// Check if any of the changed entities match our query's schema keys
			return changes.some((change: any) => {
				// changesToRealize is an array of arrays: [change_id, entity_id, schema_key, ...]
				const schemaKey = change[2] || change.schema_key;
				const changeVid =
					(change.lixcol_version_id as string | undefined) ||
					(change.version_id as string | undefined);

				// Special case: queries with 'change' schema should always re-execute
				if (schemaKeys.includes("change")) {
					return true;
				}

				// Check if this specific schema key affects our query
				if (!schemaKeys.includes(schemaKey)) return false;

				// If the query watches a specific version_id and the change carries a version id,
				// re-exec only when they match. If the change has no version id info, be conservative.
				if (watchedVersions.size > 0) {
					if (changeVid && !watchedVersions.has(changeVid)) return false;
				}
				return true;
			});
		};

		const observable = new LixObservable<T>((observer) => {
			// Add observer to pool
			listeners.add(observer);

			// Start upstream on first subscriber
			if (!isActive) {
				isActive = true;
				// Execute initial query and subscribe for updates
				void executeQuery();
				unsubscribeFromStateCommit = lix.hooks.onStateCommit((data) => {
					if (shouldReexecute(data)) void executeQuery();
				});
			}

			// If we already have a cached result, emit it immediately
			if (previousResult) observer.next?.(previousResult);

			// Cleanup for this subscriber
			return () => {
				listeners.delete(observer);
				if (listeners.size === 0) {
					// Tear down upstream and remove from pool when last unsubscribes
					isActive = false;
					unsubscribeFromStateCommit?.();
					pool.delete(poolKey);
				}
			};
		});

		// Track cleanup for non-pooled APIs that may reference activeObservables
		activeObservables.set(observable, {
			unsubscribeFromStateCommit: () => unsubscribeFromStateCommit?.(),
		});

		// Store in pool and return
		pool.set(poolKey, observable);
		return observable;
	};
}
