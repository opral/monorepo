import type { Selectable } from "kysely";
import type { LixEngine } from "../../../engine/boot.js";

/**
 * Applies the schema for the internal file path cache table.
 *
 * This cache will store precomputed full file paths so that queries like
 * `WHERE path LIKE '/foo/%'` can be answered without recomputing paths for
 * every row.
 *
 * @example
 * applyFilePathCacheSchema({ engine: lix });
 */
export function applyFilePathCacheSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS lix_internal_file_path_cache (
      file_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      directory_id TEXT,
      name TEXT NOT NULL,
      extension TEXT,
      path TEXT NOT NULL,
      PRIMARY KEY (file_id, version_id)
    ) strict;

    CREATE INDEX IF NOT EXISTS idx_lix_internal_file_path_cache_version_path
      ON lix_internal_file_path_cache (version_id, path);

    CREATE INDEX IF NOT EXISTS idx_lix_internal_file_path_cache_version_directory
      ON lix_internal_file_path_cache (version_id, directory_id);
  `);
}

export type InternalFilePathCacheRow = Selectable<InternalFilePathCacheTable>;

export type InternalFilePathCacheTable = {
	file_id: string;
	version_id: string;
	directory_id: string | null;
	name: string;
	extension: string | null;
	path: string;
};
