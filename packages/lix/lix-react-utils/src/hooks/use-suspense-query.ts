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

/**
 * Subscribe to a live query using React 19 Suspense.
 *
 * @example
 * ```tsx
 * function KeyValueList() {
 *   const keyValues = useSuspenseQuery(lix =>
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
 * // Wrap with Suspense and ErrorBoundary:
 * <Suspense fallback={<div>Loading...</div>}>
 *   <ErrorBoundary fallback={<div>Error occurred</div>}>
 *     <KeyValueList />
 *   </ErrorBoundary>
 * </Suspense>
 * ```
 */
export function useSuspenseQuery<TRow>(
	query: (lix: Lix) => SelectQueryBuilder<any, any, TRow>,
): TRow[] {
	const lix = useContext(LixContext);
	if (!lix)
		throw new Error("useSuspenseQuery must be used inside <LixProvider>.");

	// Create stable cache key
	const cacheKey = useMemo(() => query.toString(), [query]);

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

	// Subscribe for ongoing updates
	useEffect(() => {
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
	}, []); // Empty deps

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
 *   const item = useSuspenseQueryTakeFirst(lix =>
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
export const useSuspenseQueryTakeFirst = <TResult>(
	query: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
): TResult | undefined => {
	// Wrap the builder to limit results to 1
	const rows = useSuspenseQuery((lix) => query(lix).limit(1));

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
export const useSuspenseQueryTakeFirstOrThrow = <TResult>(
	query: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
): TResult => {
	// Use the regular takeFirst hook
	const data = useSuspenseQueryTakeFirst(query);

	// Throw if no data found
	if (data === undefined) {
		throw new Error("No result found");
	}

	return data;
};
