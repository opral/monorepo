/* ------------------------------------------------------------------------- *
 *  lix-react/useQuery.tsx
 *  Simple React hook for live database queries
 * ------------------------------------------------------------------------- */

import { useSyncExternalStore, useMemo, useContext } from "react";
import type { Lix } from "@lix-js/sdk";
import type { LixObservable } from "@lix-js/sdk";
import { LixContext } from "../provider.js";

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
 *   • a factory `(db) => builder` so you can depend on props / state.
 *
 * @returns `{ data, error, loading }`
 *
 * @example
 * ```tsx
 * const { data: todos } = useQuery(db =>
 *   db.selectFrom('todo')
 *     .where('completed','=',false)
 *     .orderBy('created_at asc')
 *     .selectAll()
 * )
 * ```
 */
export function useQuery<TRow>(buildQuery: any | ((db: Lix["db"]) => any)): {
	data: TRow[] | undefined;
	error: Error | null;
	loading: boolean;
} {
	/* -------------------------------- context -------------------------------- */
	const lix = useContext(LixContext);
	if (!lix) throw new Error("useQuery must be used inside <LixProvider>.");

	/* ---------------------------- freeze builder ----------------------------- */
	const builder = useMemo(
		() => (typeof buildQuery === "function" ? buildQuery(lix.db) : buildQuery),
		[], // frozen for component lifetime (recreate hook if query must change)
	);

	/* ------------------------- create observable once ------------------------ */
	const observableRef = useMemo<LixObservable<TRow>>(
		() => lix.observe(builder),
		[], // same reason as above
	);

	/* --------- internal snapshot object shared with useSyncExternalStore ---- */
	const snapshot = useMemo<Snapshot<TRow>>(
		() => ({ data: undefined, error: null }),
		[],
	);

	/* ---------------------------- SyncExtStore hook -------------------------- */
	const { data, error } = useSyncExternalStore<Snapshot<TRow>>(
		(callback) => {
			/* subscribe */
			const sub = observableRef.subscribe({
				next: (rows) => {
					snapshot.data = rows;
					snapshot.error = null;
					callback();
				},
				error: (err) => {
					snapshot.error = err instanceof Error ? err : new Error(String(err));
					callback();
				},
			});
			return () => sub.unsubscribe();
		},
		/* getSnapshot */
		() => snapshot,
		/* getServerSnapshot (SSR) */
		() => ({ data: undefined, error: null }),
	);

	/* local loading flag: true until first next or error */
	const loading = data === undefined && error === null;

	return { data, error, loading };
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
	if (
		!res.loading &&
		!res.error &&
		(res.data === undefined || res.data.length === 0)
	) {
		throw new Error("useQueryFirstOrThrow: query returned no rows");
	}
	return { ...res, data: res.data?.[0] as TRow };
};
