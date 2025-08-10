import type { Lix } from "../../lix/open-lix.js";

/**
 * Retrieves cached file data if it exists.
 *
 * @example
 * const cachedData = getFileDataCache({
 *   lix,
 *   fileId: "file_123",
 *   versionId: "version_456"
 * });
 * 
 * if (cachedData) {
 *   // Use cached data
 *   return cachedData;
 * }
 */
export function getFileDataCache(args: {
	lix: Pick<Lix, "sqlite">;
	fileId: string;
	versionId: string;
}): Uint8Array | undefined {
	const result = args.lix.sqlite.exec({
		sql: `
      SELECT data 
      FROM internal_file_data_cache 
      WHERE file_id = ? 
      AND version_id = ?
    `,
		bind: [args.fileId, args.versionId],
		returnValue: "resultRows",
	});

	const cachedData = result[0]?.[0] as Uint8Array | undefined;
	return cachedData;
}