import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import type { DetectedChange, LixPlugin } from "./lix-plugin.js";
import { flatten, unflatten } from "./mock-json-plugin.flatten.js";

export const MockJsonPropertySchema: LixSchemaDefinition = {
	type: "object",
	properties: {
		value: JSONTypeSchema,
	},
	required: ["value"],
	additionalProperties: false,
	"x-lix-key": "mock_json_property",
	"x-lix-version": "1.0",
} as const;

/**
 * A mock plugin that handles JSON data.
 *
 * Use this mock plugin for testing purposes. Do not
 * use this plugin in production! It may change at
 * any time.
 *
 * @example
 *   const lix = await openLix({
 *     providePlugins: [mockJsonPlugin],
 *   });
 */
export const mockJsonPlugin: LixPlugin = {
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
					schema: MockJsonPropertySchema,
					entity_id: key,
					snapshot_content: null, // Indicates deletion of this property
				});
			} else if (
				JSON.stringify(flattenedBefore[key]) !==
				JSON.stringify(flattenedAfter[key])
			) {
				detectedChanges.push({
					schema: MockJsonPropertySchema,
					entity_id: key,
					snapshot_content: { value: flattenedAfter[key] },
				});
			}
		}

		for (const key in flattenedAfter) {
			if (!(key in flattenedBefore)) {
				detectedChanges.push({
					schema: MockJsonPropertySchema,
					entity_id: key,
					snapshot_content: { value: flattenedAfter[key] },
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
			if (change.snapshot_content === null) {
				// If the content is null, remove the entity from the state
				delete flattened[change.entity_id];
			} else {
				// Update the current state with the new change content
				// Need to decode the BLOB content from the snapshot
				// The plugin should handle deserializing the object stored in the BLOB
				flattened[change.entity_id] = (change.snapshot_content as any).value;
			}
		}

		return {
			fileData: new TextEncoder().encode(
				JSON.stringify(unflatten(flattened, { delimiter: "." }))
			),
		};
	},
};
