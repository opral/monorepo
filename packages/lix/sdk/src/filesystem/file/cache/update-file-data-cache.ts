import type { LixEngine } from "../../../engine/boot.js";

/**
 * Updates the file data cache with materialized file content.
 * Used for write-through caching after file insert/update operations.
 *
 * @example
 * updateFileDataCache({
 *   engine: lix.engine!,
 *   fileId: "file_123",
 *   versionId: "version_456",
 *   data: new Uint8Array([...])
 * });
 */
export function updateFileDataCache(args: {
	engine: Pick<LixEngine, "sqlite">;
	fileId: string;
	versionId: string;
	data: Uint8Array;
}): void {
	// Use INSERT OR REPLACE for write-through caching
	args.engine.sqlite.exec({
		sql: `
      INSERT OR REPLACE INTO internal_file_data_cache 
      (file_id, version_id, data)
      VALUES (?, ?, ?)
    `,
		bind: [args.fileId, args.versionId, args.data],
		returnValue: "resultRows",
	});
}
