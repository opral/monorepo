import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import type { DetectedChange, LixPlugin } from "../../plugin/lix-plugin.js";

export const LixUnknownFileSchema = {
	type: "object",
	properties: {
		value: {
			type: "string",
			contentEncoding: "base64",
			description: "Base64-encoded binary file data",
		},
	},
	"x-lix-key": "lix_unknown_file",
	"x-lix-version": "1.0",
} as const;
LixUnknownFileSchema satisfies LixSchemaDefinition;

// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
function base64ToBytes(base64: string): Uint8Array {
	const binString = atob(base64);
	return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
function bytesToBase64(bytes: Uint8Array): string {
	const binString = String.fromCodePoint(...bytes);
	return btoa(binString);
}

/**
 * Internal fallback plugin that handles unknown file types by storing the entire blob.
 * This serves as a fallback for materialization when no specific plugin matches a file.
 *
 * This plugin always matches any file path and stores the complete file data
 * as a single entity, allowing retrieval of the original file content.
 */
export const lixUnknownFileFallbackPlugin: LixPlugin = {
	key: "lix_unknown_file_fallback_plugin",
	detectChangesGlob: "*", // Matches all files
	detectChanges: ({ before, after }) => {
		const detectedChanges: DetectedChange<any>[] = [];

		// Compare the raw file data using Unicode-safe base64 encoding
		const beforeData = before?.data;
		const afterData = after.data;

		const beforeBase64 = beforeData ? bytesToBase64(beforeData) : "";
		const afterBase64 = afterData ? bytesToBase64(afterData) : "";

		if (beforeBase64 !== afterBase64) {
			detectedChanges.push({
				schema: LixUnknownFileSchema,
				entity_id: after.id,
				snapshot_content: { value: afterBase64 }, // Store as Unicode-safe base64 string
			});
		}

		return detectedChanges;
	},
	applyChanges: ({ file, changes }) => {
		// This plugin snapshots the entire file, so there should only be one change
		if (changes.length > 1) {
			throw new Error(
				`[lix_unknown_file_fallback_plugin] Expected exactly one change for file ${file.id}, but received ${changes.length} changes`
			);
		}

		// There must be exactly one change for this file
		if (changes.length === 0) {
			throw new Error(
				`[lix_unknown_file_fallback_plugin] Expected exactly one change for file ${file.id}, but received no changes`
			);
		}

		const fileChange = changes[0]!; // Safe since we validated length > 0

		// The change must match this file's ID
		if (fileChange.entity_id !== file.id) {
			throw new Error(
				`[lix_unknown_file_fallback_plugin] Expected change for file ${file.id}, but received change for entity ${fileChange.entity_id}`
			);
		}

		if (typeof fileChange.snapshot_content?.value === "string") {
			// Restore the blob from Unicode-safe base64 string
			return {
				fileData: base64ToBytes(fileChange.snapshot_content.value),
			};
		}

		throw new Error(
			`[lix_unknown_file_fallback_plugin] Expected base64 string content for file ${file.id}, but received ${typeof fileChange.snapshot_content}`
		);
	},
};
