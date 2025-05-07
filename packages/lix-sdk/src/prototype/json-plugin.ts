import type { DetectedChange } from "../plugin/lix-plugin.js";
import { flatten, unflatten } from "../plugin/mock-json-plugin.flatten.js";
import type { Change } from "./database-schema.js";
import type { LixFile } from "./file-schema.js";

type LixPluginV2 = {
	key: string;
	detectChangesGlob: string;
	detectChanges: ({
		before,
		after,
	}: {
		before?: { data: Uint8Array };
		after?: { data: Uint8Array };
	}) => DetectedChange<any>[];
	applyChanges: ({
		file,
		changes,
	}: {
		/**
		 * The file to which the changes should be applied.
		 *
		 * The `file.data` might be undefined if the file does not
		 * exist at the time of applying the changes. This can
		 * happen when merging a version that created a new file
		 * that did not exist in the target version. Or, a file
		 * has been deleted and should be restored at a later point.
		 */
		file: Omit<LixFile, "data"> & { data?: LixFile["data"] };
		changes: Array<
			Change & {
				snapshot: { content: Record<string, any> | null };
			}
		>;
	}) => { fileData: Uint8Array };
};

/**
 * A mock plugin that handles JSON data.
 *
 * Use this mock plugin for testing purposes. Do not
 * use this plugin in production! It may change at
 * any time.
 *
 * @example
 *   const lix = await openLixInMemory({
 *     providePlugins: [mockJsonPlugin],
 *   });
 */
export const mockJsonPluginV2: LixPluginV2 = {
	key: "mock_json_plugin",
	detectChangesGlob: "*.json",
	detectChanges: ({ before, after }) => {
		const detectedChanges: DetectedChange<any>[] = [];

		const beforeParsed = before?.data
			? JSON.parse(new TextDecoder().decode(before?.data))
			: {};
		const afterParsed = after?.data
			? JSON.parse(new TextDecoder().decode(after?.data))
			: {};

		const flattenedBefore = flatten(beforeParsed, {
			safe: true,
		}) as Record<string, unknown>;
		const flattenedAfter = flatten(afterParsed, {
			safe: true,
		}) as Record<string, unknown>;

		for (const key in flattenedBefore) {
			if (!(key in flattenedAfter)) {
				detectedChanges.push({
					schema: {
						key: "mock_json_property",
						type: "json",
					},
					entity_id: key,
					snapshot: undefined,
				});
			} else if (
				JSON.stringify(flattenedBefore[key]) !==
				JSON.stringify(flattenedAfter[key])
			) {
				detectedChanges.push({
					schema: {
						key: "mock_json_property",
						type: "json",
					},
					entity_id: key,
					snapshot: {
						value: flattenedAfter[key],
					},
				});
			}
		}

		for (const key in flattenedAfter) {
			if (!(key in flattenedBefore)) {
				detectedChanges.push({
					schema: {
						key: "mock_json_property",
						type: "json",
					},
					entity_id: key,
					snapshot: {
						value: flattenedAfter[key],
					},
				});
			}
		}

		return detectedChanges;
	},
	applyChanges: ({ file, changes }) => {
		// Get the current state from the file data
		let flattened: Record<string, any> = {};

		if (file.data && file.data.length > 0) {
			try {
				flattened = flatten(JSON.parse(new TextDecoder().decode(file.data)), {
					delimiter: ".",
				});
			} catch (error) {
				// Handle potential parsing errors if the initial file data isn't valid JSON
				console.error("Failed to parse existing file data:", error);
			}
		}

		// Build a JSON object mapping entity_id to snapshot content
		for (const change of changes) {
			if (change.snapshot.content === null) {
				// If the content is null, remove the entity from the state
				delete flattened[change.entity_id];
			} else {
				// Update the current state with the new change content
				// Need to decode the BLOB content from the snapshot
				// The plugin should handle deserializing the object stored in the BLOB
				flattened[change.entity_id] = change.snapshot.content;
			}
		}

		return {
			fileData: new TextEncoder().encode(
				JSON.stringify(unflatten(flattened, { delimiter: "." }))
			),
		};
	},
};
