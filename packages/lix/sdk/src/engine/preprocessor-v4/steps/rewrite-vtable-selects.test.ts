import { describe, expect, test } from "vitest";
import { rewriteVtableSelects } from "./rewrite-vtable-selects.js";
import { schemaKeyToCacheTableName } from "../../../state/cache/create-schema-cache-table.js";

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

		console.log(rewritten.sql);

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
});
