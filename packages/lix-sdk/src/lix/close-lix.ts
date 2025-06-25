import type { Lix } from "./open-lix.js";

/**
 * Destroys the underlying database connection.
 *
 * After closing the Lix instance all subsequent operations on it
 * will fail. Call this when your application no longer needs access
 * to the file.
 *
 * @example
 * ```ts
 * await closeLix({ lix })
 * ```
 */
export async function closeLix(args: { lix: Pick<Lix, "db"> }): Promise<void> {
	await args.lix.db.destroy();
}
