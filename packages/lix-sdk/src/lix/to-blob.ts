import { contentFromDatabase } from "sqlite-wasm-kysely";
import type { Lix } from "./open-lix.js";

/**
 * Serialises the Lix database into a {@link Blob}.
 *
 * Use this helper to persist the current state to disk or send it to a
 * server. The blob contains the raw SQLite file representing the Lix
 * project.
 *
 * @example
 * ```ts
 * const blob = await toBlob({ lix })
 * download(blob)
 * ```
 */
export async function toBlob(args: {
	lix: Pick<Lix, "db" | "sqlite">;
}): Promise<Blob> {
	return new Blob([contentFromDatabase(args.lix.sqlite)]);
}
