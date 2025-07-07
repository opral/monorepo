/* ------------------------------------------------------------------------- *
 *  lix-react/useSuspenseQuery.tsx
 *  React 19 Suspense-based hooks for live database queries
 * ------------------------------------------------------------------------- */

import { useMemo, useContext, useEffect, useState, use } from "react";
import type { Lix, LixDatabaseSchema } from "@lix-js/sdk";
import { LixContext } from "../provider.js";
import type { SelectQueryBuilder } from "kysely";

// Map to cache promises by query key
const queryPromiseCache = new Map<string, Promise<any>>();

interface UseQueryOptions {
	subscribe?: boolean;
}

/**
 * Subscribe to a live query using React 19 Suspense.
 *
 * @param query - Factory function that creates a Kysely SelectQueryBuilder
 * @param options - Optional configuration
 * @param options.subscribe - Whether to subscribe to live updates (default: true)
 *
 * @example
 * ```tsx
 * function KeyValueList() {
 *   const keyValues = useQuery(lix =>
 *     lix.db.selectFrom('key_value')
 *       .where('key', 'like', 'example_%')
 *       .selectAll()
 *   );
 *
 *   // No loading/error states needed - Suspense and ErrorBoundary handle them
 *   return (
 *     <ul>
 *       {keyValues.map(item => (
 *         <li key={item.key}>{item.key}: {item.value}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * // One-time query without subscription
 * function ConfigData() {
 *   const config = useQuery(lix =>
 *     lix.db.selectFrom('config').selectAll(),
 *     { subscribe: false }
 *   );
 *
 *   return <div>{config.length} config items</div>;
 * }
 *
 * // Wrap with Suspense and ErrorBoundary:
 * <Suspense fallback={<div>Loading...</div>}>
 *   <ErrorBoundary fallback={<div>Error occurred</div>}>
 *     <KeyValueList />
 *   </ErrorBoundary>
 * </Suspense>
 * ```
 */
export function useQuery<TRow>(
	query: (lix: Lix) => SelectQueryBuilder<any, any, TRow>,
	options: UseQueryOptions = {},
): TRow[] {
	const lix = useContext(LixContext);
	if (!lix) throw new Error("useQuery must be used inside <LixProvider>.");

	const { subscribe = true } = options;

	// Create stable cache key that includes the compiled SQL to capture closure variables
	const cacheKey = useMemo(() => {
		// Compile the query to get the actual SQL with parameters
		const builder = query(lix);
		const compiled = builder.compile();
		return `${subscribe ? "sub" : "once"}:${compiled.sql}:${JSON.stringify(compiled.parameters)}`;
	}, [query, lix, subscribe]);

	// Get or create promise
	let promise = queryPromiseCache.get(cacheKey);
	if (!promise) {
		const builder = query(lix);
		promise = builder.execute() as Promise<TRow[]>;
		queryPromiseCache.set(cacheKey, promise);
	}

	// Use the promise (suspends on first render)
	const initialRows = use(promise);

	// Local state for updates
	const [rows, setRows] = useState(initialRows);

	// Subscribe for ongoing updates (only if subscribe is true)
	useEffect(() => {
		if (!subscribe) {
			// For one-time queries, just use the initial data
			setRows(initialRows);
			return;
		}

		const builder = query(lix);
		const sub = lix.observe(builder).subscribe({
			next: (value) => setRows(value as TRow[]),
			error: (err) => {
				// Clear promise to allow retry
				queryPromiseCache.delete(cacheKey);
				// Surface error to ErrorBoundary
				setRows(() => {
					throw err instanceof Error ? err : new Error(String(err));
				});
			},
		});
		return () => sub.unsubscribe();
	}, [cacheKey, subscribe, initialRows]); // Re-subscribe when query changes

	return rows;
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
 *   const item = useQueryTakeFirst(lix =>
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
	query: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
	options: UseQueryOptions = {},
): TResult | undefined => {
	// Wrap the builder to limit results to 1
	const rows = useQuery((lix) => query(lix).limit(1), options);

	// Return the first row or undefined
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
 *   const item = useSuspenseQueryTakeFirstOrThrow(lix =>
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
	query: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
	options: UseQueryOptions = {},
): TResult => {
	// Use the regular takeFirst hook
	const data = useQueryTakeFirst(query, options);

	// Throw if no data found
	if (data === undefined) {
		throw new Error("No result found");
	}

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
