import { type Change, type LixFile, type LixPlugin } from "@lix-js/sdk";
import { detectChanges } from "../detect-changes.js";

type DetectArgs = Parameters<NonNullable<LixPlugin["detectChanges"]>>[0];
type MockFile = Pick<LixFile, "id" | "path"> & {
	metadata?: LixFile["metadata"];
	lixcol_metadata?: LixFile["metadata"];
};

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
	file: MockFile;
	fileUpdates: Uint8Array[];
}) {
	const allChanges = [];

	// Process each update sequentially, comparing with the previous state
	for (let i = 0; i < args.fileUpdates.length; i++) {
		const before =
			i === 0
				? undefined
				: ({
						...args.file,
						data: args.fileUpdates[i - 1],
					} as DetectArgs["before"]);

		const after = {
			...args.file,
			data: args.fileUpdates[i]!,
		} as DetectArgs["after"];

		const detectedChanges = detectChanges({ before, after } as DetectArgs);

		// Transform DetectedChange objects to the format expected by applyChanges
		const formattedChanges: (Change & { snapshot_content: any })[] =
			detectedChanges.map((change) => ({
				id: crypto.randomUUID(),
				entity_id: change.entity_id,
				created_at: new Date().toISOString(),
				snapshot_content: change.snapshot_content,
				schema_key: change.schema["x-lix-key"],
				schema_version: change.schema["x-lix-version"],
				file_id: after.id,
				plugin_key: "mock",
				snapshot_id: "mock",
				metadata: null,
			}));

		allChanges.push(...formattedChanges);
	}

	return allChanges;
}
