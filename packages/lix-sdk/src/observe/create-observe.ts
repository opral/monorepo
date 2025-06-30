import type { SelectQueryBuilder } from "kysely";
import type { Lix } from "../lix/open-lix.js";
import { LixObservable } from "./lix-observable.js";

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

	/**
	 * Converts a **Kysely read-query** into a **LixObservable** – an implementation of
	 * the TC-39 Observable protocol that emits a fresh result-set every time the
	 * underlying state mutates.
	 *
	 * @example **Full table stream**
	 * ```ts
	 * observe(
	 *   lix.db.selectFrom('key_value').selectAll()
	 * ).subscribe({
	 *   next: rows => console.table(rows)
	 * })
	 * ```
	 *
	 * @example **Watch latest change-set (first row)**
	 * ```ts
	 * observe(
	 *   lix.db.selectFrom('change_set_all')
	 *         .selectAll()
	 *         .orderBy('created_at desc')
	 * ).subscribeTakeFirst({
	 *   next: cs => console.log('head →', cs)
	 * })
	 * ```
	 */
	return function observe<T>(
		query: SelectQueryBuilder<any, any, T>,
		options: ObserveOptions = { mode: "array" }
	): LixObservable<T> {
		// Create the observable
		const observable = new LixObservable<T>((observer) => {
			let isActive = true;
			let previousResult: T[] | undefined;

			// Helper to execute the query
			const executeQuery = async () => {
				if (!isActive) return;

				try {
					// Optimize query for first/firstOrThrow modes
					let optimizedQuery = query;
					if (options.mode === "first" || options.mode === "firstOrThrow") {
						// Add limit(1) if we only need the first row
						optimizedQuery = query.limit(1) as any;
					}

					// Execute the query
					const result = await optimizedQuery.execute();

					if (!isActive) return;

					// Check if results have changed
					const hasChanged =
						!previousResult || !areResultsEqual(previousResult, result as T[]);

					if (hasChanged) {
						previousResult = result as T[];

						// Handle different modes
						if (options.mode === "first") {
							observer.next?.(result as T[]);
						} else if (options.mode === "firstOrThrow") {
							observer.next?.(result as T[]);
						} else {
							// Default: array mode
							observer.next?.(result as T[]);
						}
					}
				} catch (error) {
					if (!isActive) return;
					observer.error?.(error);
				}
			};

			// Execute initial query
			executeQuery();

			// Subscribe to state commits for updates
			const unsubscribeFromStateCommit = lix.hooks.onStateCommit(() => {
				executeQuery();
			});

			// Store the cleanup function
			activeObservables.set(observable, { unsubscribeFromStateCommit });

			// Return cleanup function
			return () => {
				isActive = false;
				unsubscribeFromStateCommit();
				activeObservables.delete(observable);
			};
		});

		// Handle mode-specific behavior by returning wrapped observables
		if (options.mode === "first") {
			// For compatibility, we still return the base observable
			// The subscribeTakeFirst method handles the transformation
			return observable;
		} else if (options.mode === "firstOrThrow") {
			// For compatibility, we still return the base observable
			// The subscribeTakeFirstOrThrow method handles the transformation
			return observable;
		}

		return observable;
	};
}
