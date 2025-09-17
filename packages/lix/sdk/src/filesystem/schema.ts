import type { LixEngine } from "../engine/boot.js";
import { applyFileDatabaseSchema } from "./file/schema.js";
import { applyDirectoryDatabaseSchema } from "./directory/schema.js";

/**
 * Applies all filesystem-related database schemas (files + directories).
 *
 * @example
 * applyFilesystemSchema({ engine });
 */
export function applyFilesystemSchema(args: { engine: LixEngine }): void {
	applyFileDatabaseSchema({ engine: args.engine });
	applyDirectoryDatabaseSchema({ engine: args.engine });
}
