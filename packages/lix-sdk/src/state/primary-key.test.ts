import { test, expect } from "vitest";
import {
	serializeStatePk,
	parseStatePk,
	type StatePkTag,
} from "./primary-key.js";

test("makePk creates correct composite key for simple values", () => {
	const pk = serializeStatePk("U", "file1", "entity1", "version1");
	// No special characters, so no encoding needed
	expect(pk).toBe("U~file1~entity1~version1");
});

test("makePk handles special characters in fields", () => {
	const pk = serializeStatePk(
		"C",
		"file|with|pipes",
		"entity-123",
		"ver/sion:1"
	);
	// Special characters should be percent-encoded
	expect(pk).toBe("C~file%7Cwith%7Cpipes~entity-123~ver%2Fsion%3A1");
});

test("parsePk correctly parses simple composite key", () => {
	const result = parseStatePk("UI~file1~entity1~version1");
	expect(result).toEqual({
		tag: "UI",
		fileId: "file1",
		entityId: "entity1",
		versionId: "version1",
	});
});

test("parsePk handles fields with special characters", () => {
	// Test with encoded values
	const result = parseStatePk(
		"CI~file%7Cwith%7Cpipes~entity-123~ver%2Fsion%3A1"
	);
	expect(result).toEqual({
		tag: "CI",
		fileId: "file|with|pipes",
		entityId: "entity-123",
		versionId: "ver/sion:1",
	});
});

test("roundtrip encoding and decoding preserves data", () => {
	const testCases: Array<[StatePkTag, string, string, string]> = [
		["U", "simple", "test", "v1"],
		["UI", "file-with-dash", "entity", "version"],
		["C", "file", "entity_with_underscore", "version"],
		["CI", "file", "entity", "version.with.dot"],
		["U", "a|b", "c:d", "e/f"], // various special chars
		["C", "---", "test", "v1"], // multiple dashes
		["UI", "", "", ""], // empty strings
		["CI", "file-", "-entity", "-version-"], // dashes at edges
	];

	for (const [tag, fileId, entityId, versionId] of testCases) {
		const pk = serializeStatePk(tag, fileId, entityId, versionId);
		const parsed = parseStatePk(pk);

		expect(parsed).toEqual({
			tag,
			fileId,
			entityId,
			versionId,
		});
	}
});

test("parsePk handles edge cases", () => {
	// Empty strings are valid values
	const result1 = parseStatePk("U~~~");
	expect(result1).toEqual({
		tag: "U",
		fileId: "",
		entityId: "",
		versionId: "",
	});

	// Complex field values
	const result2 = parseStatePk(
		"C~file/path/to/resource~com.example.entity~v1.2.3"
	);
	expect(result2).toEqual({
		tag: "C",
		fileId: "file/path/to/resource",
		entityId: "com.example.entity",
		versionId: "v1.2.3",
	});
});

test("all tag types are handled", () => {
	const tags: StatePkTag[] = ["U", "UI", "C", "CI"];

	for (const tag of tags) {
		const pk = serializeStatePk(tag, "file", "entity", "version");
		const parsed = parseStatePk(pk);
		expect(parsed.tag).toBe(tag);
	}
});

test("makePk and parsePk handle Unicode correctly", () => {
	const pk = serializeStatePk(
		"U",
		"文件-file",
		"エンティティ-entity",
		"版本-version"
	);
	const parsed = parseStatePk(pk);

	expect(parsed).toEqual({
		tag: "U",
		fileId: "文件-file",
		entityId: "エンティティ-entity",
		versionId: "版本-version",
	});
});

test("handles entity IDs with tildes", () => {
	// This is the critical test - entity ID contains a tilde
	const pk = serializeStatePk("C", "test_file", "cat1~id1", "version1");
	// The tilde in entity ID should be encoded as %7E
	expect(pk).toBe("C~test_file~cat1%7Eid1~version1");

	// And it should parse back correctly
	const parsed = parseStatePk(pk);
	expect(parsed).toEqual({
		tag: "C",
		fileId: "test_file",
		entityId: "cat1~id1",
		versionId: "version1",
	});
});

test("parsePk throws on malformed input", () => {
	// Missing parts
	expect(() => parseStatePk("U")).toThrow(
		"Invalid composite key: U - expected 4 parts"
	);

	// Only tag and one field
	expect(() => parseStatePk("C~file")).toThrow(
		"Invalid composite key: C~file - expected 4 parts"
	);

	// Two fields
	expect(() => parseStatePk("UI~file~entity")).toThrow(
		"Invalid composite key: UI~file~entity - expected 4 parts"
	);

	// Too many fields
	expect(() => parseStatePk("CI~file~entity~version~extra")).toThrow(
		"Invalid composite key: CI~file~entity~version~extra - expected 4 parts"
	);
});
