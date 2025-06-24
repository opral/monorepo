import { uuidV7, type Change, type LixFile } from "@lix-js/sdk";
import { detectChanges } from "../detectChanges.js";

/**
 * Directly feeds an array of file updates into the plugin's detectChanges function,
 * bypassing Lix database operations.
 *
 * @example
 *   ```
 *   const changes = mockChanges({ ... })
 *   ```
 */
export function mockChanges(args: {
	file: Omit<LixFile, "data">;
	fileUpdates: Uint8Array[];
}) {
	const allChanges = [];

	// Process each update sequentially, comparing with the previous state
	for (let i = 0; i < args.fileUpdates.length; i++) {
		const before =
			i === 0
				? undefined
				: {
						id: args.file.id ?? "mock",
						path: args.file.path,
						data: args.fileUpdates[i - 1],
						metadata: args.file.metadata,
					};

		const after = {
			id: args.file.id ?? "mock",
			path: args.file.path,
			data: args.fileUpdates[i]!,
			metadata: args.file.metadata,
		};

		const detectedChanges = detectChanges({ before, after });

		// Transform DetectedChange objects to the format expected by applyChanges
		const formattedChanges: (Change & { snapshot_content: any })[] =
			detectedChanges.map((change) => ({
				id: uuidV7(),
				entity_id: change.entity_id,
				created_at: new Date().toISOString(),
				snapshot_content: change.snapshot_content,
				schema_key: change.schema["x-lix-key"],
				schema_version: change.schema["x-lix-version"],
				file_id: after.id,
				plugin_key: "mock",
				snapshot_id: "mock",
			}));

		allChanges.push(...formattedChanges);
	}

	return allChanges;
}
