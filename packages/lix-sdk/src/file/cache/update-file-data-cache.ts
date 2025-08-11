import type { Lix } from "../../lix/open-lix.js";

/**
 * Updates the file data cache with materialized file content.
 * Used for write-through caching after file insert/update operations.
 *
 * @example
 * updateFileDataCache({
 *   lix,
 *   fileId: "file_123",
 *   versionId: "version_456",
 *   data: new Uint8Array([...])
 * });
 */
export function updateFileDataCache(args: {
	lix: Pick<Lix, "sqlite">;
	fileId: string;
	versionId: string;
	data: Uint8Array;
}): void {
	// Use INSERT OR REPLACE for write-through caching
	args.lix.sqlite.exec({
		sql: `
      INSERT OR REPLACE INTO internal_file_data_cache 
      (file_id, version_id, data)
      VALUES (?, ?, ?)
    `,
		bind: [args.fileId, args.versionId, args.data],
		returnValue: "resultRows",
	});
}
