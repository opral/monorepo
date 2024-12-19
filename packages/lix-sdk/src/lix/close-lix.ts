import type { Lix } from "./open-lix.js";

/**
 * Closes the lix.
 */
export async function closeLix(args: { lix: Pick<Lix, "db"> }): Promise<void> {
	await args.lix.db.destroy();
}
