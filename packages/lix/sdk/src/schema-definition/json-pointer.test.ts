import { describe, expect, test } from "vitest";
import {
	buildSqliteJsonPath,
	extractValueAtPath,
	parseJsonPointer,
	parsePointerPaths,
} from "./json-pointer.js";

describe("parseJsonPointer", () => {
	test("parses simple pointer", () => {
		expect(parseJsonPointer("/foo/bar")).toEqual(["foo", "bar"]);
	});

	test("handles escaped characters", () => {
		expect(parseJsonPointer("/foo~0bar/~1baz")).toEqual(["foo~bar", "/baz"]);
	});

	test("throws on invalid pointer", () => {
		expect(() => parseJsonPointer("foo")).toThrowError(
			/JSON Pointer "foo" must start with/
		);
		expect(() => parseJsonPointer("")).toThrowError(
			/JSON Pointer must not be empty/
		);
		expect(() => parseJsonPointer("/foo//bar")).toThrowError(
			/contains an empty segment/
		);
	});
});

describe("parsePointerPaths", () => {
	test("returns empty array for non arrays", () => {
		expect(parsePointerPaths(undefined)).toEqual([]);
		// @ts-expect-error intentionally passing invalid input
		expect(parsePointerPaths("foo")).toEqual([]);
	});

	test("parses property names and pointers", () => {
		const paths = parsePointerPaths(["name", "/value/x-lix-version"]);
		expect(paths).toHaveLength(2);
		expect(paths[0]).toEqual({
			label: "name",
			segments: ["name"],
			jsonPath: "$.name",
		});
		expect(paths[1]).toEqual({
			label: "/value/x-lix-version",
			segments: ["value", "x-lix-version"],
			jsonPath: '$.value."x-lix-version"',
		});
	});

	test("skips invalid entries", () => {
		const paths = parsePointerPaths(["", "/bad//path"]);
		expect(paths).toEqual([]);
	});

	test("keeps array indices in json path", () => {
		const [result] = parsePointerPaths(["/items/0/name"]);
		expect(result?.jsonPath).toBe("$.items[0].name");
	});
});

describe("buildSqliteJsonPath", () => {
	test("quotes unsafe identifiers", () => {
		expect(buildSqliteJsonPath(["value", "x-lix-version", 'needs"quote'])).toBe(
			'$.value."x-lix-version"."needs\\"quote"'
		);
	});

	test("handles numeric segments as array indices", () => {
		expect(buildSqliteJsonPath(["a", "0", "b"])).toBe("$.a[0].b");
	});
});

describe("extractValueAtPath", () => {
	const source = {
		name: "example",
		value: {
			items: [{ id: 1 }, { id: 2 }],
			meta: { "x-lix-version": "1.0" },
		},
	};

	test("returns nested object values", () => {
		expect(extractValueAtPath(source, ["value", "meta", "x-lix-version"])).toBe(
			"1.0"
		);
	});

	test("supports array access", () => {
		expect(extractValueAtPath(source, ["value", "items", "1", "id"])).toBe(2);
	});

	test("returns undefined when path does not exist", () => {
		expect(extractValueAtPath(source, ["missing"])).toBeUndefined();
		expect(
			extractValueAtPath(source, ["value", "items", "foo"])
		).toBeUndefined();
	});
});
