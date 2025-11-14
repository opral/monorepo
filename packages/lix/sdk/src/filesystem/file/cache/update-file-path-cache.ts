import type { LixEngine } from "../../../engine/boot.js";

/**
 * Inserts or updates a file path cache entry.
 *
 * @example
 * updateFilePathCache({
 *   engine: lix.engine!,
 *   fileId: "file_1",
 *   versionId: "global",
 *   directoryId: "dir_1",
 *   name: "index",
 *   extension: "ts",
 *   path: "/src/index.ts"
 * });
 */
export function updateFilePathCache(args: {
	engine: Pick<LixEngine, "sqlite">;
	fileId: string;
	versionId: string;
	directoryId: string | null;
	name: string;
	extension: string | null;
	path: string;
}): void {
	args.engine.sqlite.exec({
		sql: `
      INSERT OR REPLACE INTO lix_internal_file_path_cache (
        file_id,
        version_id,
        directory_id,
        name,
        extension,
        path
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
		bind: [
			args.fileId,
			args.versionId,
			args.directoryId,
			args.name,
			args.extension,
			args.path,
		],
		returnValue: "resultRows",
	});
}
