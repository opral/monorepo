import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import {
	createSchemaCacheTableV2,
	schemaKeyToCacheTableNameV2,
} from "./create-schema-cache-table.js";
import { CACHE_COLUMNS } from "./cache-columns.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

const exampleSchema: LixSchemaDefinition = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		count: { type: "integer" },
	},
	"x-lix-key": "lix_test_create",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
};

test("createSchemaCacheTableV2 creates table with core indexes and is idempotent", async () => {
	const lix = await openLix({});

	const tableName = schemaKeyToCacheTableNameV2("lix_test_create", "1.0");

	// First call should create the table and indexes
	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema: exampleSchema,
		tableName,
	});

	// Verify table exists and WITHOUT ROWID
	const tbl = lix.engine!.sqlite.exec({
		sql: `SELECT name, sql FROM sqlite_schema WHERE type='table' AND name = ?`,
		bind: [tableName],
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(tbl?.[0]?.name).toBe(tableName);
	expect(String(tbl?.[0]?.sql || "")).toMatch(/WITHOUT ROWID/);

	// Verify core indexes exist
	const idxRows = lix.engine!.sqlite.exec({
		sql: `SELECT name, sql FROM sqlite_schema WHERE type='index' AND tbl_name = ? ORDER BY name`,
		bind: [tableName],
		returnValue: "resultRows",
		rowMode: "object",
	}) as { name: string; sql: string }[];

	const names = new Set(idxRows.map((r) => r.name));
	expect(Array.from(names)).toEqual(
		expect.arrayContaining([
			`idx_${tableName}_version_id`,
			`idx_${tableName}_vfe`,
			`idx_${tableName}_fv`,
		])
	);

	// Second call should be a no-op (idempotent)
	createSchemaCacheTableV2({
		engine: lix.engine!,
		schema: exampleSchema,
		tableName,
	});

	// Property columns are created for schema properties
	const columns = lix.engine!.sqlite.exec({
		sql: `SELECT name FROM pragma_table_info('${tableName}')`,
		returnValue: "resultRows",
	}) as Array<[string]>;
	const columnNames = new Set(columns.map((row) => row[0]));

	for (const core of CACHE_COLUMNS) {
		expect(columnNames.has(core)).toBe(true);
	}
	for (const propertyColumn of ["x_id", "x_name", "x_count"]) {
		expect(columnNames.has(propertyColumn)).toBe(true);
	}

	const idxRows2 = lix.engine!.sqlite.exec({
		sql: `SELECT name FROM sqlite_schema WHERE type='index' AND tbl_name = ?`,
		bind: [tableName],
		returnValue: "resultRows",
	}) as string[][];

	// Still contains the same three core indexes (no duplicates)
	const idxCount = idxRows2.filter((r) =>
		String(r?.[0] || "").startsWith(`idx_${tableName}_`)
	).length;
	expect(idxCount).toBeGreaterThanOrEqual(3);
});
