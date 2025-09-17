import type { LixEngine } from "../../engine/boot.js";
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
 *   engine: lix.engine!,
 *   file: { id: "file_123", path: "/test.json", metadata: null },
 *   versionId: "version_456"
 * });
 */
export function selectFileData(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "getAllPluginsSync">;
	file: Pick<LixFile, "id" | "path"> &
		Partial<Omit<LixFile, "id" | "path" | "data">>;
	versionId: string;
}): Uint8Array {
	// Check cache first
	const result = args.engine.sqlite.exec({
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
		engine: args.engine,
		file: args.file,
		versionId: args.versionId,
	});

	// Update cache for next time (write-through)
	updateFileDataCache({
		engine: { sqlite: args.engine.sqlite } as any,
		fileId: args.file.id,
		versionId: args.versionId,
		data,
	});

	return data;
}
