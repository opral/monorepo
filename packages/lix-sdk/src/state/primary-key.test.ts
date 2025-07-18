import { test, expect } from "vitest";
import { serializePk, parsePk, type StatePkTag } from "./primary-key.js";

test("makePk creates correct composite key for simple values", () => {
	const pk = serializePk("U", "file1", "entity1", "version1");
	expect(pk).toBe("U~file1~entity1~version1");
});

test("makePk handles special characters in fields", () => {
	const pk = serializePk("C", "file|with|pipes", "entity-123", "ver/sion:1");
	expect(pk).toBe("C~file|with|pipes~entity-123~ver/sion:1");
});

test("parsePk correctly parses simple composite key", () => {
	const result = parsePk("UI~file1~entity1~version1");
	expect(result).toEqual({
		tag: "UI",
		fileId: "file1",
		entityId: "entity1",
		versionId: "version1",
	});
});

test("parsePk handles fields with special characters", () => {
	const result = parsePk("CI~file|with|pipes~entity-123~ver/sion:1");
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
		const pk = serializePk(tag, fileId, entityId, versionId);
		const parsed = parsePk(pk);

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
	const result1 = parsePk("U~~~");
	expect(result1).toEqual({
		tag: "U",
		fileId: "",
		entityId: "",
		versionId: "",
	});

	// Complex field values
	const result2 = parsePk("C~file/path/to/resource~com.example.entity~v1.2.3");
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
		const pk = serializePk(tag, "file", "entity", "version");
		const parsed = parsePk(pk);
		expect(parsed.tag).toBe(tag);
	}
});

test("makePk and parsePk handle Unicode correctly", () => {
	const pk = serializePk(
		"U",
		"文件-file",
		"エンティティ-entity",
		"版本-version"
	);
	const parsed = parsePk(pk);

	expect(parsed).toEqual({
		tag: "U",
		fileId: "文件-file",
		entityId: "エンティティ-entity",
		versionId: "版本-version",
	});
});

test("parsePk throws on malformed input", () => {
	// Missing parts
	expect(() => parsePk("U")).toThrow(
		"Invalid composite key: U - expected 4 parts separated by ~"
	);

	// Only tag and one field
	expect(() => parsePk("C~file")).toThrow(
		"Invalid composite key: C~file - expected 4 parts separated by ~"
	);

	// Two fields
	expect(() => parsePk("UI~file~entity")).toThrow(
		"Invalid composite key: UI~file~entity - expected 4 parts separated by ~"
	);

	// Too many fields
	expect(() => parsePk("CI~file~entity~version~extra")).toThrow(
		"Invalid composite key: CI~file~entity~version~extra - expected 4 parts separated by ~"
	);
});
