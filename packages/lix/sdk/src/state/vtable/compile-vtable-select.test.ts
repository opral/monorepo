import { describe, expect, test } from "vitest";
import { compileVtableSelectSql } from "./compile-vtable-select.js";
import { schemaKeyToCacheTableName } from "../cache/create-schema-cache-table.js";

describe("compileVtableSelectSql", () => {
	test("compiles inline SQL with cache routing for provided schema keys", () => {
		const sql = compileVtableSelectSql({
			filteredSchemaKeys: ["test_schema"],
		});

		expect(sql).toContain(schemaKeyToCacheTableName("test_schema"));
		expect(sql).toContain(schemaKeyToCacheTableName("lix_version_descriptor"));
		expect(sql).toMatch(/WITH RECURSIVE/i);
	});

	test("deduplicates schema keys while always including the descriptor cache", () => {
		const sql = compileVtableSelectSql({
			filteredSchemaKeys: ["alpha_schema", "alpha_schema"],
		});

		const alphaTable = schemaKeyToCacheTableName("alpha_schema");
		const descriptorTable = schemaKeyToCacheTableName("lix_version_descriptor");

		const alphaMatches = sql.match(new RegExp(alphaTable, "g")) ?? [];
		const descriptorMatches = sql.match(new RegExp(descriptorTable, "g")) ?? [];

		expect(alphaMatches.length).toBeGreaterThan(0);
		expect(descriptorMatches.length).toBeGreaterThan(0);
		expect(new Set(alphaMatches).size).toBe(1);
	});

	test("omits writer and metadata projections when they are not required", () => {
		const sql = compileVtableSelectSql({
			filteredSchemaKeys: ["filtered_schema"],
			requiredColumns: ["entity_id", "schema_key"],
		});

		expect(sql).not.toMatch(/lix_internal_state_writer/i);
		expect(sql).not.toMatch(/metadata AS metadata/i);
	});

	test.skip("only projects required columns in each union segment", () => {
		const sql = compileVtableSelectSql({
			filteredSchemaKeys: ["scoped_schema"],
			requiredColumns: ["entity_id", "schema_key"],
		});

		const upper = sql.toUpperCase();
		expect(upper).toContain("TXN.ENTITY_ID AS ENTITY_ID");
		expect(upper).toContain("TXN.SCHEMA_KEY AS SCHEMA_KEY");
		expect(upper).not.toContain("PLUGIN_KEY AS PLUGIN_KEY");
		expect(upper).not.toContain("SNAPSHOT_CONTENT AS SNAPSHOT_CONTENT");
		expect(upper).not.toContain('"PLUGIN_KEY"');
		expect(upper).toContain("ROW_NUMBER() OVER");
		expect(upper).toContain("FROM RANKED W");
	});

	test("prunes transaction segments when transaction state is closed", () => {
		const sql = compileVtableSelectSql({
			filteredSchemaKeys: ["demo_schema"],
			hasOpenTransaction: false,
		});

		const upper = sql.toUpperCase();
		expect(upper).not.toContain("LIX_INTERNAL_TRANSACTION_STATE");
		expect(upper).toContain("LIX_INTERNAL_STATE_ALL_UNTRACKED");
	});

	test("includes only cache tables for matching schema filters", () => {
		const primary = "test_schema_key";
		const secondary = "test_schema_key_other";

		const sql = compileVtableSelectSql({
			filteredSchemaKeys: [primary],
		});

		const lower = sql.toLowerCase();
		expect(lower).toContain(schemaKeyToCacheTableName(primary).toLowerCase());
		expect(lower).not.toContain(
			schemaKeyToCacheTableName(secondary).toLowerCase()
		);
	});
});
