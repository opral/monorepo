import { expect, test } from "vitest";
import { buildJsonObjectEntries } from "./build-json-object-entries.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

const TestSchema = {
	"x-lix-key": "test_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		version: { type: "string" },
		count: { type: "number" },
		flag: { type: "boolean" },
		data: { type: "object" },
		arr: { type: "array" },
	},
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;

test("uses json_quote for string fields to prevent coercion", () => {
	const sql = buildJsonObjectEntries({
		schema: TestSchema,
		ref: (p) => `NEW.${p}`,
	});
	expect(sql).toContain("'name', json_quote(NEW.name)");
	expect(sql).toContain("'version', json_quote(NEW.version)");
});

test("uses json/json_quote combo for object/array fields", () => {
	const sql = buildJsonObjectEntries({
		schema: TestSchema,
		ref: (p) => `NEW.${p}`,
	});
	expect(sql).toContain(
		"'data', CASE WHEN json_valid(NEW.data) THEN json(NEW.data) ELSE json_quote(NEW.data) END"
	);
	expect(sql).toContain(
		"'arr', CASE WHEN json_valid(NEW.arr) THEN json(NEW.arr) ELSE json_quote(NEW.arr) END"
	);
});
