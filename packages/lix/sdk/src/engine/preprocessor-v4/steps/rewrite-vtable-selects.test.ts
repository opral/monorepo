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
	});
});
