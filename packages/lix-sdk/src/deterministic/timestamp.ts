import type { Lix } from "../lix/open-lix.js";
import { nextSequenceNumber } from "./sequence.js";
import { isDeterministicMode } from "./is-deterministic-mode.js";

/**
 * Returns the current **logical timestamp** as an ISO 8601 string.
 * 
 * In deterministic mode, returns timestamps starting from Unix epoch (1970-01-01),
 * with the clock advancing according to implementation (e.g. +1 ms per write).
 * In normal mode, returns the current system time.
 *
 * @example Normal mode - returns current time
 * ```ts
 * const lix = await openLix();
 * timestamp({ lix }); // "2024-03-15T10:30:45.123Z"
 * ```
 *
 * @example Deterministic mode - logical clock from epoch
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: true }]
 * });
 * timestamp({ lix }); // "1970-01-01T00:00:00.000Z"
 * timestamp({ lix }); // "1970-01-01T00:00:00.001Z"
 * timestamp({ lix }); // "1970-01-01T00:00:00.002Z"
 * ```
 *
 * @example Use in database operations for createdAt, TTL, time-ordered queries
 * ```ts
 * await lix.db
 *   .insertInto("log")
 *   .values({
 *     id: "log1",
 *     created_at: timestamp({ lix }),
 *     message: "User logged in"
 *   })
 *   .execute();
 * ```
 * 
 * @param args.lix - The Lix instance with sqlite and db connections
 * @returns ISO 8601 timestamp string
 * 
 * @remarks
 * - Monotone, never decreases
 * - Persisted and resumed on re-open / clone
 * - Typical use cases: `createdAt`, TTL, "time-ordered" queries
 */
export function timestamp(args: { lix: Pick<Lix, "sqlite" | "db"> }): string {
	// Check if deterministic mode is enabled
	if (isDeterministicMode({ lix: args.lix })) {
		// Get the next deterministic counter value
		const counter = nextSequenceNumber({
			lix: args.lix,
		});
		// Use counter as milliseconds since epoch
		return new Date(counter).toISOString();
	}

	// Return current timestamp in ISO format
	return new Date().toISOString();
}
