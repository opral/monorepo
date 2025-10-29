import { describe, expect, test } from "vitest";
import { rewriteVtableSelects } from "./rewrite-vtable-selects.js";
import { schemaKeyToCacheTableName } from "../../../state/cache/create-schema-cache-table.js";
import type { PreprocessorTrace } from "../types.js";

const buildCacheTableMap = (
	schemaKeys: readonly string[]
): Map<string, string> => {
	return new Map(
		schemaKeys.map((schemaKey) => [
			schemaKey,
			schemaKeyToCacheTableName(schemaKey),
		])
	);
};

describe("rewriteVtableSelects", () => {
	test("rewrites selects targeting the internal vtable when cache tables are available", () => {
		const schemaKey = "test_schema";
		const versionId = "global_version";

		const cacheTables = buildCacheTableMap([
			schemaKey,
			"lix_version_descriptor",
		]);

		const result = rewriteVtableSelects({
			statements: [
				{
					sql: `
						SELECT v.entity_id, v.snapshot_content
						FROM lix_internal_state_vtable AS v
						WHERE v.schema_key = ?1
						  AND v.version_id = ?2
					`,
					parameters: [schemaKey, versionId],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(result.statements).toHaveLength(1);
		const rewritten = result.statements[0]!;

		expect(rewritten.parameters).toEqual([schemaKey, versionId]);
		expect(rewritten.sql).toContain("WITH RECURSIVE");
		expect(rewritten.sql).toContain(
			schemaKeyToCacheTableName("lix_version_descriptor")
		);
		expect(rewritten.sql).toContain(schemaKeyToCacheTableName(schemaKey));
		expect(rewritten.sql).toMatch(/FROM\s+\(\s*WITH RECURSIVE/i);
		expect(rewritten.sql).toMatch(/AS\s+"v"/);
		expect(rewritten.sql).not.toMatch(/FROM\s+"lix_internal_state_vtable"/i);
	});

	test("pushes down schema_key filters into the inline SQL", () => {
		const schemaKey = "test_schema";

		const cacheTables = buildCacheTableMap([
			schemaKey,
			"lix_version_descriptor",
		]);

		const trace: PreprocessorTrace = [];

		rewriteVtableSelects({
			trace,
			statements: [
				{
					sql: `
					SELECT *
					FROM lix_internal_state_vtable AS v
					WHERE v.schema_key = ?1
				`,
					parameters: [schemaKey],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(trace).toHaveLength(1);
		expect(trace[0]!.payload?.filtered_schema_keys).toEqual([schemaKey]);
		expect(trace[0]!.payload?.selected_columns).toBeNull();
	});

	test("pushes down schema filters wrapped in AND clauses", () => {
		const schemaKey = "test_schema";

		const cacheTables = buildCacheTableMap([
			schemaKey,
			"lix_version_descriptor",
		]);

		const trace: PreprocessorTrace = [];

		rewriteVtableSelects({
			trace,
			statements: [
				{
					sql: `
					SELECT *
					FROM lix_internal_state_vtable AS v
					WHERE v.schema_key = ?1
					  AND v.version_id = ?2
				`,
					parameters: [schemaKey, "version"],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(trace).toHaveLength(1);
		expect(trace[0]!.payload?.filtered_schema_keys).toEqual([schemaKey]);
		expect(trace[0]!.payload?.selected_columns).toBeNull();
	});

	test("pushes down schema filters across OR clauses", () => {
		const schemaKeyA = "schema_a";
		const schemaKeyB = "schema_b";

		const cacheTables = buildCacheTableMap([
			schemaKeyA,
			schemaKeyB,
			"lix_version_descriptor",
		]);

		const trace: PreprocessorTrace = [];

		rewriteVtableSelects({
			trace,
			statements: [
				{
					sql: `
						SELECT *
						FROM lix_internal_state_vtable AS v
						WHERE v.schema_key = ?1
							OR v.schema_key = ?2
					`,
					parameters: [schemaKeyA, schemaKeyB],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(trace).toHaveLength(1);
		expect(trace[0]!.payload?.filtered_schema_keys).toEqual([
			schemaKeyA,
			schemaKeyB,
		]);
		expect(trace[0]!.payload?.selected_columns).toBeNull();
	});

	test("pushes down schema filters defined with IN predicates", () => {
		const schemaKeyA = "schema_a";
		const schemaKeyB = "schema_b";

		const cacheTables = buildCacheTableMap([
			schemaKeyA,
			schemaKeyB,
			"lix_version_descriptor",
		]);

		const trace: PreprocessorTrace = [];

		rewriteVtableSelects({
			trace,
			statements: [
				{
					sql: `
						SELECT *
						FROM lix_internal_state_vtable AS v
						WHERE v.schema_key IN (?1, ?2)
					`,
					parameters: [schemaKeyA, schemaKeyB],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(trace).toHaveLength(1);
		expect(trace[0]!.payload?.filtered_schema_keys).toEqual([
			schemaKeyA,
			schemaKeyB,
		]);
		expect(trace[0]!.payload?.selected_columns).toBeNull();
	});

	test("processes multiple statements targeting the vtable", () => {
		const firstSchema = "schema_a";
		const secondSchema = "schema_b";

		const cacheTables = buildCacheTableMap([
			firstSchema,
			secondSchema,
			"lix_version_descriptor",
		]);

		const trace: PreprocessorTrace = [];

		const result = rewriteVtableSelects({
			trace,
			statements: [
				{
					sql: `
						SELECT *
						FROM lix_internal_state_vtable
						WHERE schema_key = ?1
					`,
					parameters: [firstSchema],
				},
				{
					sql: `
						SELECT *
						FROM lix_internal_state_vtable
						WHERE schema_key = ?1
					`,
					parameters: [secondSchema],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(result.statements).toHaveLength(2);
		expect(trace).toHaveLength(2);
		expect(trace[0]!.payload?.filtered_schema_keys).toEqual([firstSchema]);
		expect(trace[0]!.payload?.selected_columns).toBeNull();
		expect(trace[1]!.payload?.filtered_schema_keys).toEqual([secondSchema]);
		expect(trace[1]!.payload?.selected_columns).toBeNull();

		const first = result.statements[0]!;
		const second = result.statements[1]!;

		expect(first.sql).toContain("WITH RECURSIVE");
		expect(second.sql).toContain("WITH RECURSIVE");
		expect(first.sql).not.toMatch(/FROM\s+"lix_internal_state_vtable"/i);
		expect(second.sql).not.toMatch(/FROM\s+"lix_internal_state_vtable"/i);
	});

	test("pushes down selected columns into the inline SQL", () => {
		const schemaKey = "test_schema";

		const cacheTables = buildCacheTableMap([
			schemaKey,
			"lix_version_descriptor",
		]);

		const trace: PreprocessorTrace = [];

		const result = rewriteVtableSelects({
			trace,
			statements: [
				{
					sql: `
					SELECT v.entity_id, v.schema_key
					FROM lix_internal_state_vtable AS v
					WHERE v.schema_key = ?1
				`,
					parameters: [schemaKey],
				},
			],
			getCacheTables: () => cacheTables,
		});

		expect(result.statements).toHaveLength(1);
		expect(trace).toHaveLength(1);

		const rewritten = result.statements[0]!;
		expect(rewritten.sql).toMatch(/FROM\s+\(\s*\nWITH RECURSIVE/);

		const normalized = rewritten.sql.replace(/\s+/g, " ").trim();
		expect(normalized).toMatch(
			/^SELECT v\.entity_id, v\.schema_key FROM \( WITH RECURSIVE/
		);
		expect(normalized).toMatch(/WHERE v\.schema_key = \?1$/);

		const upper = rewritten.sql.toUpperCase();
		expect(upper).toContain("W.ENTITY_ID AS ENTITY_ID");
		expect(upper).toContain("W.SCHEMA_KEY AS SCHEMA_KEY");
		expect(upper).not.toContain("SNAPSHOT_CONTENT AS SNAPSHOT_CONTENT");

		expect(trace[0]!.payload?.filtered_schema_keys).toEqual([schemaKey]);
		expect(trace[0]!.payload?.selected_columns).toEqual([
			"entity_id",
			"schema_key",
		]);
	});
});
