import type { Selectable } from "kysely";
import type { LixEngine } from "../../../engine/boot.js";

/**
 * Applies the file data cache schema to the database.
 *
 * The cache stores materialized file data to avoid repeated
 * plugin processing and change aggregation.
 *
 * @example
 * applyFileDataCacheSchema(lix);
 */
export function applyFileDataCacheSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
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
