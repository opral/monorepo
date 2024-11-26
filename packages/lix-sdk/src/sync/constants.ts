import type { LixDatabaseSchema } from "../database/schema.js";

/**
 * Tables that should not be synced.
 *
 * Using a blacklist approach because most
 * tables should be synced.
 */
export const NOT_TO_BE_SYNCED_TABLES: Array<keyof LixDatabaseSchema> = [
	"active_account",
	"change_queue",
	"current_version",
];
