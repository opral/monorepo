import { distinctUntilChanged, from, switchMap, timer } from "rxjs";

/**
 * Polls a query at a given interval and only emits an
 * event if the result of the query has changed.
 *
 * @example
 *   pollQuery(
 * 	   () => db.selectFrom("mock").where("id", "=", "joker").selectAll().execute(),
 *     { interval: 100 }
 *   ).subscribe((value) => console.log(value));
 */
export function pollQuery<T>(
	query: () => Promise<T>,
	options?: { interval?: number }
) {
	return timer(0, options?.interval ?? 1000).pipe(
		switchMap(() => from(query())),
		distinctUntilChanged(
			// using simplified comparison because a deep equal
			// is not worth the cost (compute, dependency, maintenance)
			// if a false positives slip through it's not a big deal
			(prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
		)
	);
}
