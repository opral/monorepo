import { describe, expect, test } from "vitest";
import {
	extractPrimaryType,
	mapSchemaPropertyToSqliteType,
} from "./sqlite-type-mapper.js";

describe("mapSchemaPropertyToSqliteType", () => {
	test("maps string to TEXT", () => {
		expect(mapSchemaPropertyToSqliteType({ type: "string" })).toBe("TEXT");
	});

	test("maps integer to INTEGER", () => {
		expect(mapSchemaPropertyToSqliteType({ type: "integer" })).toBe("INTEGER");
	});

	test("maps number to REAL", () => {
		expect(mapSchemaPropertyToSqliteType({ type: "number" })).toBe("REAL");
	});

	test("maps boolean to INTEGER", () => {
		expect(mapSchemaPropertyToSqliteType({ type: "boolean" })).toBe("INTEGER");
	});

	test("maps object to TEXT", () => {
		expect(mapSchemaPropertyToSqliteType({ type: "object" })).toBe("TEXT");
	});

	test("maps array to TEXT", () => {
		expect(mapSchemaPropertyToSqliteType({ type: "array" })).toBe("TEXT");
	});

	test("maps multi-type excluding null", () => {
		expect(mapSchemaPropertyToSqliteType({ type: ["null", "string"] })).toBe(
			"TEXT"
		);
	});

	test("defaults unknown to ANY", () => {
		expect(mapSchemaPropertyToSqliteType({})).toBe("ANY");
	});
});

describe("extractPrimaryType", () => {
	test("returns null for invalid definitions", () => {
		expect(extractPrimaryType(undefined)).toBeNull();
		expect(extractPrimaryType(42 as any)).toBeNull();
	});

	test("returns string type", () => {
		expect(extractPrimaryType({ type: "string" })).toBe("string");
	});

	test("returns first non-null type in array", () => {
		expect(extractPrimaryType({ type: ["null", "number"] })).toBe("number");
	});
});
