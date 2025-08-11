import type { Lix } from "../lix/open-lix.js";
import type { LixFile } from "./schema.js";
import { materializeFileData } from "./materialize-file-data.js";
import { updateFileDataCache } from "./cache/update-file-data-cache.js";

/**
 * Selects file data with caching support.
 *
 * First checks the cache, and if not found, materializes the file data
 * and updates the cache for future reads.
 *
 * @example
 * const data = selectFileData({
 *   lix,
 *   file: { id: "file_123", path: "/test.json", metadata: null },
 *   versionId: "version_456"
 * });
 */
export function selectFileData(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db">;
	file: Omit<LixFile, "data">;
	versionId: string;
}): Uint8Array {
	// Check cache first
	const result = args.lix.sqlite.exec({
		sql: `
			SELECT data 
			FROM internal_file_data_cache 
			WHERE file_id = ? 
			AND version_id = ?
		`,
		bind: [args.file.id, args.versionId],
		returnValue: "resultRows",
	});

	const cachedData = result[0]?.[0] as Uint8Array | undefined;
	if (cachedData) {
		// Cache hit!
		return cachedData;
	}

	// Cache miss - materialize the file data
	const data = materializeFileData({
		lix: args.lix,
		file: args.file,
		versionId: args.versionId,
	});

	// Update cache for next time (write-through)
	updateFileDataCache({
		lix: args.lix,
		fileId: args.file.id,
		versionId: args.versionId,
		data,
	});

	return data;
}
