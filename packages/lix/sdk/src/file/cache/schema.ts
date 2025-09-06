import type { Selectable } from "kysely";
import type { Lix } from "../../lix/open-lix.js";

/**
 * Applies the file data cache schema to the database.
 *
 * The cache stores materialized file data to avoid repeated
 * plugin processing and change aggregation.
 *
 * @example
 * applyFileDataCacheSchema(lix);
 */
export function applyFileDataCacheSchema(lix: Pick<Lix, "sqlite">): void {
	lix.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS internal_file_data_cache (
      file_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      data BLOB NOT NULL,
      PRIMARY KEY (file_id, version_id)
    ) strict;

    -- Index for fast version_id filtering
    CREATE INDEX IF NOT EXISTS idx_internal_file_data_cache_version_id 
      ON internal_file_data_cache (version_id);
  `);
}

export type InternalFileDataCacheRow = Selectable<InternalFileDataCacheTable>;

export type InternalFileDataCacheTable = {
	file_id: string;
	version_id: string;
	data: Uint8Array;
};
