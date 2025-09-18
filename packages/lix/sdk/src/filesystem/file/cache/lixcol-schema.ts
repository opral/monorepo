import type { Selectable } from "kysely";
import type { LixEngine } from "../../../engine/boot.js";

export type InternalFileLixcolCacheRow =
	Selectable<InternalFileLixcolCacheTable>;

export type InternalFileLixcolCacheTable = {
	file_id: string;
	version_id: string;
	latest_change_id: string;
	latest_commit_id: string;
	created_at: string;
	updated_at: string;
	writer_key: string | null;
};

/**
 * Schema for the file lixcol metadata cache.
 *
 * This cache stores the expensive-to-compute lixcol columns for files,
 * avoiding the need for complex subqueries in the file view.
 *
 * The view can query this table directly using SQL:
 * SELECT latest_change_id, latest_commit_id, created_at, updated_at, writer_key
 * FROM internal_file_lixcol_cache
 * WHERE file_id = ? AND version_id = ?
 */
export function applyFileLixcolCacheSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	// Create the cache table for file lixcol metadata
	args.engine.sqlite.exec(`
		CREATE TABLE IF NOT EXISTS internal_file_lixcol_cache (
			file_id TEXT NOT NULL,
			version_id TEXT NOT NULL,
			latest_change_id TEXT,
			latest_commit_id TEXT,
			created_at TEXT,
			updated_at TEXT,
			writer_key TEXT,
			PRIMARY KEY (file_id, version_id)
		) STRICT;

		-- Index for fast lookups
		CREATE INDEX IF NOT EXISTS idx_file_lixcol_cache_lookup 
		ON internal_file_lixcol_cache(file_id, version_id);
	`);
}
