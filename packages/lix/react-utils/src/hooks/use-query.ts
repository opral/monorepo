/* ------------------------------------------------------------------------- *
 *  lix-react/useSuspenseQuery.tsx
 *  React 19 Suspense-based hooks for live database queries
 * ------------------------------------------------------------------------- */

import { useMemo, useContext, useEffect, useRef, useState, use } from "react";
import type { Lix } from "@lix-js/sdk";
import { LixContext } from "../provider.js";
import type { SelectQueryBuilder } from "kysely";

// Map to cache promises by query key
const queryPromiseCache = new Map<string, Promise<any>>();
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

	// Create stable cache key that includes the compiled SQL to capture closure variables
	const cacheKey = useMemo(() => {
		// Compile the query to get the actual SQL with parameters
		const builder = query({ lix });
		const compiled = builder.compile();
		return `${lixInstanceId}:${subscribe ? "sub" : "once"}:${compiled.sql}:${JSON.stringify(compiled.parameters)}`;
	}, [query, lix, subscribe, lixInstanceId]);

	// Get or create promise
	let promise = queryPromiseCache.get(cacheKey);
	if (!promise) {
		const builder = query({ lix });
		promise = builder.execute() as Promise<TRow[]>;
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
				const errorInstance = err instanceof Error ? err : new Error(String(err));
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
