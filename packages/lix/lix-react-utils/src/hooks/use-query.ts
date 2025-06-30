/* ------------------------------------------------------------------------- *
 *  lix-react/useQuery.tsx
 *  Simple React hook for live database queries
 * ------------------------------------------------------------------------- */

import { useMemo, useContext, useEffect, useState } from "react";
import type { Lix, LixDatabaseSchema } from "@lix-js/sdk";
import { LixContext } from "../provider.js";
import type { SelectQueryBuilder } from "kysely";

/* ────────────────────────────────────────────────────────────────────────── */
/* useQuery                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

// Internal snapshot type for useSyncExternalStore
type Snapshot<T> = {
	data: T[] | undefined;
	error: Error | null;
};

/**
 * Subscribe to a live query inside React.
 *
 * @param buildQuery - Factory function that creates a Kysely SelectQueryBuilder
 * @returns `{ data, error, loading }` with discriminated union types for type guards
 *
 * @example
 * ```tsx
 * function KeyValueList() {
 *   const result = useQuery(lix =>
 *     lix.db.selectFrom('key_value')
 *       .where('key', 'like', 'user_%')
 *       .selectAll()
 *   );
 *
 *   if (result.error) {
 *     return <div>Error: {result.error.message}</div>;
 *   }
 *
 *   if (result.loading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   // TypeScript knows result.data is KeyValue[] here
 *   return (
 *     <ul>
 *       {result.data.map(item => (
 *         <li key={item.key}>{item.key}: {item.value}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
type UseQueryResult<TResult> =
	| { data: undefined; error: Error; loading: false }
	| { data: undefined; error: null; loading: true }
	| { data: TResult[]; error: null; loading: false };

export function useQuery<TResult>(
	buildQuery: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
): UseQueryResult<TResult> {
	/* -------------------------------- context -------------------------------- */
	const lix = useContext(LixContext);
	if (!lix) throw new Error("useQuery must be used inside <LixProvider>.");

	/* ---------------------------- freeze builder ----------------------------- */
	const builder = useMemo(
		() => (typeof buildQuery === "function" ? buildQuery(lix) : buildQuery),
		[], // frozen for component lifetime (recreate hook if query must change)
	);

	// Simple state-based approach
	const [state, setState] = useState<Snapshot<TResult>>({
		data: undefined,
		error: null,
	});

	useEffect(() => {
		// Subscribe to the observable
		const observable = lix.observe(builder);
		const subscription = observable.subscribe({
			next: (rows) => {
				setState({ data: rows as TResult[], error: null });
			},
			error: (err) => {
				setState({
					data: undefined,
					error: err instanceof Error ? err : new Error(String(err)),
				});
			},
		});

		// Cleanup
		return () => {
			subscription.unsubscribe();
		};
	}, [lix, builder]);

	/* local loading flag: true until first next or error */
	const loading = state.data === undefined && state.error === null;

	return {
		data: state.data,
		error: state.error,
		loading,
	} as UseQueryResult<TResult>;
}

/* ------------------------------------------------------------------------- */
/* Optional single-row helper                                                */
/* ------------------------------------------------------------------------- */

/**
 * Subscribe to a live query and return only the first result inside React.
 * Equivalent to calling `.executeTakeFirst()` on a Kysely query.
 *
 * @param buildQuery - Factory function that creates a Kysely SelectQueryBuilder
 * @returns `{ data, error, loading }` where data is TResult | undefined for empty results
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const result = useQueryTakeFirst(lix =>
 *     lix.db.selectFrom('key_value')
 *       .where('key', '=', `user_${userId}`)
 *       .selectAll()
 *   );
 *
 *   if (result.error) {
 *     return <div>Error: {result.error.message}</div>;
 *   }
 *
 *   if (result.loading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   // TypeScript knows result.data is KeyValue | undefined here
 *   if (!result.data) {
 *     return <div>User not found</div>;
 *   }
 *
 *   return <div>User: {result.data.value}</div>;
 * }
 * ```
 */
type UseQueryTakeFirstResult<TResult> =
	| { data: undefined; error: Error; loading: false }
	| { data: undefined; error: null; loading: true }
	| { data: TResult | undefined; error: null; loading: false };

export const useQueryTakeFirst = <TResult>(
	buildQuery: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
): UseQueryTakeFirstResult<TResult> => {
	/* -------------------------------- context -------------------------------- */
	const lix = useContext(LixContext);
	if (!lix)
		throw new Error("useQueryTakeFirst must be used inside <LixProvider>.");

	/* ---------------------------- freeze builder ----------------------------- */
	const builder = useMemo(
		() => (typeof buildQuery === "function" ? buildQuery(lix) : buildQuery),
		[], // frozen for component lifetime (recreate hook if query must change)
	);

	// Simple state-based approach with loading flag
	const [state, setState] = useState<{
		data: TResult | undefined;
		error: Error | null;
		hasReceived: boolean;
	}>({
		data: undefined,
		error: null,
		hasReceived: false,
	});

	useEffect(() => {
		// Reset state when effect runs
		setState({ data: undefined, error: null, hasReceived: false });

		// Subscribe to the observable using subscribeTakeFirst for efficiency
		const observable = lix.observe(builder);
		const subscription = observable.subscribeTakeFirst({
			next: (row) => {
				setState({ data: row as TResult, error: null, hasReceived: true });
			},
			error: (err) => {
				setState({
					data: undefined,
					error: err instanceof Error ? err : new Error(String(err)),
					hasReceived: true,
				});
			},
		});

		// Cleanup
		return () => {
			subscription.unsubscribe();
		};
	}, [lix, builder]);

	/* local loading flag: true until first next or error */
	const loading = !state.hasReceived;

	return {
		data: state.data,
		error: state.error,
		loading,
	} as UseQueryTakeFirstResult<TResult>;
};
