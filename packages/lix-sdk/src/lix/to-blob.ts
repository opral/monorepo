import { contentFromDatabase } from "sqlite-wasm-kysely";
import type { Lix } from "./open-lix.js";

/**
 * Convert the lix to a blob.
 *
 * @example
 *   const blob = await toBlob({ lix })
 */
export async function toBlob(args: {
	lix: Pick<Lix, "db" | "sqlite">;
}): Promise<Blob> {
	return new Blob([contentFromDatabase(args.lix.sqlite)]);
}
