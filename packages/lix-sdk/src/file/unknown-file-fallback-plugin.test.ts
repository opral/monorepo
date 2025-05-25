import { describe, it, expect } from "vitest";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";

// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
function bytesToBase64(bytes: Uint8Array): string {
	const binString = String.fromCodePoint(...bytes);
	return btoa(binString);
}

const createTestFile = (id: string, data: string) => ({
	id,
	path: `/test/${id}.unknown`,
	data: new TextEncoder().encode(data),
	version_id: "test-version",
	metadata: null,
});

describe("detectChanges", () => {
	it("should detect changes when file data is different", () => {
		const before = createTestFile("file1", "original content");
		const after = createTestFile("file1", "updated content");

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			before,
			after,
		});

		expect(changes).toHaveLength(1);
		expect(changes[0]).toMatchObject({
			schema: {
				"x-lix-key": "lix_unknown_file",
				"x-lix-version": "1.0",
			},
			entity_id: "file1",
			snapshot_content: bytesToBase64(
				new TextEncoder().encode("updated content")
			),
		});
	});

	it("should not detect changes when file data is identical", () => {
		const before = createTestFile("file1", "same content");
		const after = createTestFile("file1", "same content");

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			before,
			after,
		});

		expect(changes).toHaveLength(0);
	});

	it("should detect changes when before file is undefined (new file)", () => {
		const after = createTestFile("file1", "new file content");

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			after,
		});

		expect(changes).toHaveLength(1);
		expect(changes[0]).toMatchObject({
			schema: {
				"x-lix-key": "lix_unknown_file",
				"x-lix-version": "1.0",
			},
			entity_id: "file1",
			snapshot_content: bytesToBase64(
				new TextEncoder().encode("new file content")
			),
		});
	});

	it("should detect changes when before file has no data", () => {
		const before = { ...createTestFile("file1", ""), data: undefined as any };
		const after = createTestFile("file1", "new content");

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			before,
			after,
		});

		expect(changes).toHaveLength(1);
		expect(changes[0]).toMatchObject({
			entity_id: "file1",
			snapshot_content: bytesToBase64(new TextEncoder().encode("new content")),
		});
	});

	it("should handle binary data correctly", () => {
		const binaryData1 = new Uint8Array([0, 1, 2, 3, 255]);
		const binaryData2 = new Uint8Array([0, 1, 2, 4, 255]);

		const before = { ...createTestFile("file1", ""), data: binaryData1 };
		const after = { ...createTestFile("file1", ""), data: binaryData2 };

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			before,
			after,
		});

		expect(changes).toHaveLength(1);
		expect(changes[0]?.snapshot_content).toEqual(bytesToBase64(binaryData2));
	});

	it("should handle empty files", () => {
		const before = createTestFile("file1", "some content");
		const after = createTestFile("file1", "");

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			before,
			after,
		});

		expect(changes).toHaveLength(1);
		expect(changes[0]?.snapshot_content).toEqual(
			bytesToBase64(new Uint8Array([]))
		);
	});

	it("should handle Unicode content correctly", () => {
		// Sample string from web.dev article with various Unicode code points
		const unicodeContent = "hello⛳❤️🧀";
		const before = createTestFile("file1", "simple ascii");
		const after = createTestFile("file1", unicodeContent);

		const changes = lixUnknownFileFallbackPlugin.detectChanges!({
			before,
			after,
		});

		expect(changes).toHaveLength(1);
		expect(changes[0]).toMatchObject({
			schema: {
				"x-lix-key": "lix_unknown_file",
				"x-lix-version": "1.0",
			},
			entity_id: "file1",
			snapshot_content: bytesToBase64(new TextEncoder().encode(unicodeContent)),
		});

		// Verify the content can be round-tripped correctly
		const testChanges = [
			{
				id: "test-id",
				entity_id: "test-file",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: changes[0]?.snapshot_content,
				version_id: "test-version",
			},
		] as any;

		const result = lixUnknownFileFallbackPlugin.applyChanges!({
			file: createTestFile("test-file", ""),
			changes: testChanges,
		});

		// Decode the result back to string to verify Unicode preservation
		const decodedContent = new TextDecoder().decode(result.fileData);
		expect(decodedContent).toBe(unicodeContent);
	});
});

describe("applyChanges", () => {
	it("should restore file data from blob change", () => {
		const originalData = "test file content";
		const changes = [
			{
				id: "test-id",
				entity_id: "test-file",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: bytesToBase64(new TextEncoder().encode(originalData)),
				version_id: "test-version",
			},
		] as any;

		const result = lixUnknownFileFallbackPlugin.applyChanges!({
			file: createTestFile("test-file", ""),
			changes,
		});

		expect(result.fileData).toEqual(new TextEncoder().encode(originalData));
	});

	it("should handle binary data restoration", () => {
		const binaryData = new Uint8Array([0, 1, 2, 3, 255, 128, 64]);
		const changes = [
			{
				id: "test-id",
				entity_id: "binary-file",
				schema_key: "lix_unknown_file",
				file_id: "binary-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: bytesToBase64(binaryData),
				version_id: "test-version",
			},
		] as any;

		const result = lixUnknownFileFallbackPlugin.applyChanges!({
			file: createTestFile("binary-file", ""),
			changes,
		});

		expect(result.fileData).toEqual(binaryData);
	});

	// The plugin should throw when no changes are provided because we snapshot 
	// the entire file, so there must always be exactly one change per file
	it("should throw when no changes are provided", () => {
		expect(() => {
			lixUnknownFileFallbackPlugin.applyChanges!({
				file: createTestFile("test-file", ""),
				changes: [],
			});
		}).toThrow("Expected exactly one change for file test-file, but received no changes");
	});

	// The plugin should throw when the change doesn't match the file ID because
	// entity_id should always equal the file ID for this plugin
	it("should throw when change entity_id doesn't match file ID", () => {
		const changes = [
			{
				id: "test-id",
				entity_id: "different-file-id",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: "some content",
				version_id: "test-version",
			},
		] as any;

		expect(() => {
			lixUnknownFileFallbackPlugin.applyChanges!({
				file: createTestFile("test-file", ""),
				changes,
			});
		}).toThrow("Expected change for file test-file, but received change for entity different-file-id");
	});

	it("should handle valid base64 content", () => {
		// Since we now always expect base64 strings, any valid base64 string should work
		const changes = [
			{
				id: "test-id",
				entity_id: "test-file",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: "", // Empty base64 string
				version_id: "test-version",
			},
		] as any;

		const result = lixUnknownFileFallbackPlugin.applyChanges!({
			file: createTestFile("test-file", ""),
			changes,
		});

		expect(result.fileData).toEqual(new Uint8Array());
	});

	// The plugin should throw when receiving more than one change because 
	// we snapshot the entire file as a single blob, not multiple pieces
	it("should throw when receiving more than one change", () => {
		const changes = [
			{
				id: "test-id-1",
				entity_id: "test-file",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot-1",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: bytesToBase64(new TextEncoder().encode("content1")),
				version_id: "test-version",
			},
			{
				id: "test-id-2",
				entity_id: "test-file",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot-2",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: bytesToBase64(new TextEncoder().encode("content2")),
				version_id: "test-version",
			},
		] as any;

		expect(() => {
			lixUnknownFileFallbackPlugin.applyChanges!({
				file: createTestFile("test-file", ""),
				changes,
			});
		}).toThrow("Expected exactly one change for file test-file, but received 2 changes");
	});

	// The plugin should throw when snapshot_content is not a string because
	// we always store file data as base64-encoded strings
	it("should throw when snapshot_content is not a string", () => {
		const changes = [
			{
				id: "test-id",
				entity_id: "test-file",
				schema_key: "lix_unknown_file",
				file_id: "test-file",
				plugin_key: "lix_unknown_file_fallback_plugin",
				snapshot_id: "test-snapshot",
				created_at: "2023-01-01T00:00:00Z",
				snapshot_content: { not: "a string" },
				version_id: "test-version",
			},
		] as any;

		expect(() => {
			lixUnknownFileFallbackPlugin.applyChanges!({
				file: createTestFile("test-file", ""),
				changes,
			});
		}).toThrow("Expected base64 string content for file test-file, but received object");
	});
});

describe("plugin configuration", () => {
	it("should have correct key", () => {
		expect(lixUnknownFileFallbackPlugin.key).toBe(
			"lix_unknown_file_fallback_plugin"
		);
	});

	it("should have glob pattern that matches all files", () => {
		expect(lixUnknownFileFallbackPlugin.detectChangesGlob).toBe("*");
	});

	it("should have detectChanges function", () => {
		expect(typeof lixUnknownFileFallbackPlugin.detectChanges).toBe("function");
	});

	it("should have applyChanges function", () => {
		expect(typeof lixUnknownFileFallbackPlugin.applyChanges).toBe("function");
	});
});
