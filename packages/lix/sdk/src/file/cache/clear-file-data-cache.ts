import type { LixRuntime } from "../../runtime/boot.js";

/**
 * Clears the file data cache for a specific file and version.
 *
 * @example
 * clearFileDataCache({
 *   lix,
 *   fileId: "file_123",
 *   versionId: "version_456"
 * });
 */
export function clearFileDataCache(args: {
	runtime: Pick<LixRuntime, "sqlite">;
	fileId?: string;
	versionId?: string;
}): void {
	if (args.fileId && args.versionId) {
		// Clear specific file in specific version
		args.runtime.sqlite.exec({
			sql: `
        DELETE FROM internal_file_data_cache 
        WHERE file_id = ? 
        AND version_id = ?
      `,
			bind: [args.fileId, args.versionId],
			returnValue: "resultRows",
		});
	} else if (args.versionId) {
		// Clear all files in a specific version
		args.runtime.sqlite.exec({
			sql: `
        DELETE FROM internal_file_data_cache 
        WHERE version_id = ?
      `,
			bind: [args.versionId],
			returnValue: "resultRows",
		});
	} else if (args.fileId) {
		// Clear specific file across all versions
		args.runtime.sqlite.exec({
			sql: `
        DELETE FROM internal_file_data_cache 
        WHERE file_id = ?
      `,
			bind: [args.fileId],
			returnValue: "resultRows",
		});
	} else {
		// Clear entire cache
		args.runtime.sqlite.exec({
			sql: `DELETE FROM internal_file_data_cache`,
			returnValue: "resultRows",
		});
	}
}
