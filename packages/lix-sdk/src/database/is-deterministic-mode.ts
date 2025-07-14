import type { Lix } from "../lix/open-lix.js";
import { executeSync } from "./execute-sync.js";

/**
 * Checks if deterministic mode is enabled by querying the key_value table.
 *
 * @param args - Object containing the lix instance with sqlite connection
 * @returns true if deterministic mode is enabled, false otherwise
 */
export function isDeterministicMode(args: {
	lix: Pick<Lix, "sqlite" | "db">;
}): boolean {
	const [row] = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_deterministic_mode")
			.select("value"),
	});

	return Boolean(row?.value);
}
