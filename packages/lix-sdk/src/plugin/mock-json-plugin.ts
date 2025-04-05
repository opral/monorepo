import type { DetectedChange, LixPlugin } from "./lix-plugin.js";
import { flatten, unflatten } from "./mock-json-plugin.flatten.js";

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
export const mockJsonPlugin: LixPlugin = {
	key: "mock_json_plugin",
	detectChangesGlob: "*.json",
	detectChanges: async ({ before, after }) => {
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
	applyChanges: async ({ lix, file, changes }) => {
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

		const withSnapshots = await Promise.all(
			changes.map(async (change) => {
				return await lix.db
					.selectFrom("change")
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					.where("change.id", "=", change.id)
					.select(["change.id", "change.entity_id", "snapshot.content"])
					.executeTakeFirstOrThrow();
			})
		);

		// Build a JSON object mapping entity_id to snapshot content
		for (const change of withSnapshots) {
			if (change.content === null) {
				// If the content is null, remove the entity from the state
				delete flattened[change.entity_id];
			} else {
				// Update the current state with the new change content
				// Need to decode the BLOB content from the snapshot
				// The plugin should handle deserializing the object stored in the BLOB
				flattened[change.entity_id] = change.content.value;
			}
		}

		return {
			fileData: new TextEncoder().encode(
				JSON.stringify(unflatten(flattened, { delimiter: "." }))
			),
		};
	},
};
