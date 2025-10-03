/* ------------------------------------------------------------------------- *
 *  lix-react/useSuspenseQuery.tsx
 *  React 19 Suspense-based hooks for live database queries
 * ------------------------------------------------------------------------- */

import { useMemo, useContext, useEffect, useRef, useState, use } from "react";
import type { Lix } from "@lix-js/sdk";
import { LixContext } from "../provider.js";
import type { SelectQueryBuilder } from "kysely";

// Map to cache promises by query key (bounded LRU)
const QUERY_CACHE_MAX_ENTRIES = 256;

class PromiseLruCache<V> {
	private readonly map = new Map<string, V>();

	constructor(private readonly limit: number) {}

	get(key: string): V | undefined {
		const value = this.map.get(key);
		if (value !== undefined) {
			this.map.delete(key);
			this.map.set(key, value);
		}
		return value;
	}

	set(key: string, value: V): void {
		if (this.map.has(key)) {
			this.map.delete(key);
		}
		this.map.set(key, value);
		if (this.map.size > this.limit) {
			const oldestKey = this.map.keys().next().value as string | undefined;
			if (oldestKey !== undefined) {
				this.map.delete(oldestKey);
			}
		}
	}

	delete(key: string): void {
		this.map.delete(key);
	}

	clear(): void {
		this.map.clear();
	}

	has(key: string): boolean {
		return this.map.has(key);
	}

	get size(): number {
		return this.map.size;
	}

	keys(): string[] {
		return Array.from(this.map.keys());
	}
}

let queryPromiseCache = new PromiseLruCache<Promise<any>>(
	QUERY_CACHE_MAX_ENTRIES,
);
const lixInstanceIds = new WeakMap<Lix, number>();
let nextLixInstanceId = 1;

interface UseQueryOptions<TRow = unknown> {
	subscribe?: boolean;
	/**
	 * Optional equality check that runs before committing incoming rows. Defaults
	 * to a deep structural equality suitable for JSON-like payloads.
	 */
	equalityFn?: (next: TRow[], prev: TRow[]) => boolean;
}

// New API: the query factory receives an object to allow future extensibility.
type QueryFactory<TRow> = (args: {
	lix: Lix;
}) => SelectQueryBuilder<any, any, TRow>;

/**
 * Subscribe to a live query using React 19 Suspense.
 *
 * The hook suspends on first render and re-suspends whenever its SQL changes,
 * so wrap consuming components with React Suspense and an ErrorBoundary.
 *
 * @param query - Factory function that creates a Kysely SelectQueryBuilder. Preferred shape: `({ lix }) => ...`.
 * @param options - Optional configuration
 * @param options.subscribe - Whether to subscribe to live updates (default: true)
 *
 * @example
 * // Basic list
 * function KeyValueList() {
 *   const keyValues = useQuery(({ lix }) =>
 *     lix.db.selectFrom('key_value')
 *       .where('key', 'like', 'example_%')
 *       .selectAll()
 *   );
 *   return (
 *     <ul>
 *       {keyValues.map(item => (
 *         <li key={item.key}>{item.key}: {item.value}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * @example
 * // With Suspense + ErrorBoundary
 * import { Suspense } from 'react';
 * import { ErrorBoundary } from 'react-error-boundary';
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<div>Loading…</div>}>
 *       <ErrorBoundary fallbackRender={() => <div>Failed to load.</div>}>
 *         <KeyValueList />
 *       </ErrorBoundary>
 *     </Suspense>
 *   );
 * }
 *
 * @example
 * // One-time query without live updates
 * const config = useQuery(
 *   ({ lix }) => lix.db.selectFrom('config').selectAll(),
 *   { subscribe: false }
 * );
 */
export function useQuery<TRow>(
	query: QueryFactory<TRow>,
	options: UseQueryOptions<TRow> = {},
): TRow[] {
	const lix = useContext(LixContext);
	if (!lix) throw new Error("useQuery must be used inside <LixProvider>.");

	const { subscribe = true, equalityFn = defaultEquality } = options;
	const lixInstanceId = getLixInstanceId(lix);

	// Track the latest query factory without forcing downstream effects to depend
	// on the function identity (callers often inline arrow functions).
	const queryRef = useRef(query);
	useEffect(() => {
		queryRef.current = query;
	}, [query]);

	const { cacheKey, builder: initialBuilder } = useMemo(
		() => resolveCacheDescriptor(lix, query, subscribe, lixInstanceId),
		[query, lix, subscribe, lixInstanceId],
	);

	// Get or create promise
	let promise = queryPromiseCache.get(cacheKey);
	if (!promise) {
		promise = initialBuilder.execute() as Promise<TRow[]>;
		queryPromiseCache.set(cacheKey, promise);
	}

	// Use the promise (suspends on first render)
	const initialRows = use(promise);

	// Local state for updates
	const [rows, setRows] = useState(initialRows);
	const [error, setError] = useState<Error | null>(null);
	const lastRowsRef = useRef(initialRows);
	const lastCacheKeyRef = useRef(cacheKey);

	useEffect(() => {
		if (lastCacheKeyRef.current !== cacheKey) {
			lastCacheKeyRef.current = cacheKey;
			setError(null);
		}
	}, [cacheKey]);

	// Keep state aligned with the initial suspense payload when the query key
	// changes. Skip updates when structurally equal to avoid render loops.
	useEffect(() => {
		if (!equalityFn(initialRows, lastRowsRef.current)) {
			lastRowsRef.current = initialRows;
			setRows(initialRows);
		}
	}, [initialRows, equalityFn]);

	// Subscribe for ongoing updates (only if subscribe is true)
	useEffect(() => {
		if (!subscribe) {
			return;
		}

		const builder = queryRef.current({ lix });
		const sub = lix.observe(builder).subscribe({
			next: (value) => {
				const nextRows = value as TRow[];
				if (equalityFn(nextRows, lastRowsRef.current)) {
					return;
				}
				lastRowsRef.current = nextRows;
				setRows(nextRows);
			},
			error: (err) => {
				const errorInstance =
					err instanceof Error ? err : new Error(String(err));
				queryPromiseCache.delete(cacheKey);
				setError(errorInstance);
			},
		});
		return () => sub.unsubscribe();
	}, [cacheKey, subscribe, lix, equalityFn]);

	if (error) {
		throw error;
	}
	return rows;
}

export function invalidateQuery(cacheKey: string): void {
	queryPromiseCache.delete(cacheKey);
}

export function clearQueryCache(): void {
	queryPromiseCache.clear();
}

export function isQueryCached(cacheKey: string): boolean {
	return queryPromiseCache.has(cacheKey);
}

export function getQueryCacheSize(): number {
	return queryPromiseCache.size;
}

export function computeQueryCacheKey<TRow>(
	lix: Lix,
	query: QueryFactory<TRow>,
	options: { subscribe?: boolean } = {},
): string {
	const subscribe = options.subscribe ?? true;
	const { cacheKey } = resolveCacheDescriptor(
		lix,
		query,
		subscribe,
		getLixInstanceId(lix),
	);
	return cacheKey;
}

export const __USE_QUERY_CACHE_LIMIT = QUERY_CACHE_MAX_ENTRIES;

export function __setQueryCacheLimitForTests(limit: number): void {
	if (process.env.NODE_ENV !== "test") {
		throw new Error("__setQueryCacheLimitForTests is only available in tests");
	}
	queryPromiseCache = new PromiseLruCache<Promise<any>>(limit);
}

function defaultEquality(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	const ta = typeof a;
	const tb = typeof b;
	if ((a === null || ta !== "object") && (b === null || tb !== "object")) {
		return Object.is(a, b);
	}
	try {
		return stableStringify(a) === stableStringify(b);
	} catch {
		return false;
	}
}

function stableStringify(value: unknown): string {
	const seen = new WeakSet();
	const encode = (input: any): any => {
		if (input === null || typeof input !== "object") {
			return input;
		}
		if (seen.has(input)) {
			return "__cycle__";
		}
		seen.add(input);
		if (Array.isArray(input)) {
			return input.map(encode);
		}
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(input).sort()) {
			out[key] = encode((input as Record<string, unknown>)[key]);
		}
		return out;
	};
	return JSON.stringify(encode(value));
}

function resolveCacheDescriptor<TRow>(
	lix: Lix,
	query: QueryFactory<TRow>,
	subscribe: boolean,
	lixInstanceId: number,
) {
	const builder = query({ lix });
	const compiled = builder.compile();
	return {
		cacheKey: makeCacheKey(
			lixInstanceId,
			subscribe,
			compiled.sql,
			compiled.parameters,
		),
		builder,
	} as const;
}

function makeCacheKey(
	lixInstanceId: number,
	subscribe: boolean,
	sql: string,
	parameters: readonly unknown[],
): string {
	return `${lixInstanceId}:${subscribe ? "sub" : "once"}:${sql}:${JSON.stringify(parameters)}`;
}

function getLixInstanceId(lix: Lix): number {
	let id = lixInstanceIds.get(lix);
	if (id === undefined) {
		id = nextLixInstanceId++;
		lixInstanceIds.set(lix, id);
	}
	return id;
}

/* ------------------------------------------------------------------------- */
/* Optional single-row helper                                                */
/* ------------------------------------------------------------------------- */

/**
 * Subscribe to a live query and return only the first result inside React.
 * Equivalent to calling `.executeTakeFirst()` on a Kysely query.
 *
 * @example
 * ```tsx
 * function ExampleComponent({ itemId }: { itemId: string }) {
 *   const item = useQueryTakeFirst(({ lix }) =>
 *     lix.db.selectFrom('key_value')
 *       .where('key', '=', `example_${itemId}`)
 *       .selectAll()
 *   );
 *
 *   // No loading/error states needed - Suspense and ErrorBoundary handle them
 *   if (!item) {
 *     return <div>Item not found</div>;
 *   }
 *
 *   return <div>Value: {item.value}</div>;
 * }
 *
 * // Wrap with Suspense and ErrorBoundary:
 * <Suspense fallback={<div>Loading...</div>}>
 *   <ErrorBoundary fallback={<div>Error occurred</div>}>
 *     <ExampleComponent itemId="123" />
 *   </ErrorBoundary>
 * </Suspense>
 * ```
 */
export const useQueryTakeFirst = <TResult>(
	query: QueryFactory<TResult>,
	options: UseQueryOptions = {},
): TResult | undefined => {
	const rows = useQuery<TResult>(query, options);
	return rows[0] as TResult | undefined;
};

/**
 * Subscribe to a live query and return only the first result inside React.
 * Throws an error if no result is found.
 *
 * @param query - Factory function that creates a Kysely SelectQueryBuilder
 *
 * @throws Error if no result is found
 *
 * @example
 * ```tsx
 * function ExampleDetail({ itemId }: { itemId: string }) {
 *   const item = useSuspenseQueryTakeFirstOrThrow(({ lix }) =>
 *     lix.db.selectFrom('key_value')
 *       .where('key', '=', `example_${itemId}`)
 *       .selectAll()
 *   );
 *
 *   // No need to check for undefined - will throw to ErrorBoundary if not found
 *   return <div>Value: {item.value}</div>;
 * }
 *
 * // Wrap with Suspense and ErrorBoundary:
 * <Suspense fallback={<div>Loading...</div>}>
 *   <ErrorBoundary fallback={<div>Item not found</div>}>
 *     <ExampleDetail itemId="123" />
 *   </ErrorBoundary>
 * </Suspense>
 * ```
 */
export const useQueryTakeFirstOrThrow = <TResult>(
	query: QueryFactory<TResult>,
	options: UseQueryOptions = {},
): TResult => {
	const data = useQueryTakeFirst(query, options);
	if (data === undefined) throw new Error("No result found");
	return data;
};

/**
 * @deprecated Use `useQuery` instead.
 * This will be removed in a future version.
 */
export const useSuspenseQuery = useQuery;

/**
 * @deprecated Use `useQueryTakeFirst` instead.
 * This will be removed in a future version.
 */
export const useSuspenseQueryTakeFirst = useQueryTakeFirst;

/**
 * @deprecated Use `useQueryTakeFirstOrThrow` instead.
 * This will be removed in a future version.
 */
export const useSuspenseQueryTakeFirstOrThrow = useQueryTakeFirstOrThrow;
