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
 * @param buildQuery – either:
 *   • a ready-made Kysely SelectQueryBuilder, **or**
 *   • a factory `(lix) => builder` so you can depend on props / state.
 *
 * @returns `{ data, error, loading }`
 *
 * @example
 * ```tsx
 * const { data: todos } = useQuery(lix =>
 *   lix.db.selectFrom('todo')
 *     .where('completed','=',false)
 *     .orderBy('created_at asc')
 *     .selectAll()
 * )
 * ```
 */
export function useQuery<TResult>(
	buildQuery: (lix: Lix) => SelectQueryBuilder<LixDatabaseSchema, any, TResult>,
): {
	data: TResult[] | undefined;
	error: Error | null;
	loading: boolean;
} {
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

	return { data: state.data, error: state.error, loading };
}

/* ------------------------------------------------------------------------- */
/* Optional first-row helpers                                                */
/* ------------------------------------------------------------------------- */

export const useQueryFirst = <TRow>(
	q: Parameters<typeof useQuery<TRow>>[0],
) => {
	const { data, ...rest } = useQuery(q);
	return { data: data?.[0], ...rest };
};

export const useQueryFirstOrThrow = <TRow>(
	q: Parameters<typeof useQuery<TRow>>[0],
) => {
	const res = useQuery(q);

	// If we have data but it's empty, return an error
	if (
		!res.loading &&
		!res.error &&
		res.data !== undefined &&
		res.data.length === 0
	) {
		return {
			data: undefined,
			error: new Error("Query returned no rows"),
			loading: false,
		};
	}

	return {
		data: res.data?.[0],
		error: res.error,
		loading: res.loading,
	};
};
