import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "./create-schema-cache-table.js";

test("createSchemaCacheTable creates table with core indexes and is idempotent", async () => {
	const lix = await openLix({});

	const tableName = schemaKeyToCacheTableName("lix_test_create");

	// First call should create the table and indexes
	createSchemaCacheTable({ runtime: { sqlite: lix.sqlite }, tableName });

	// Verify table exists and WITHOUT ROWID
	const tbl = lix.sqlite.exec({
		sql: `SELECT name, sql FROM sqlite_schema WHERE type='table' AND name = ?`,
		bind: [tableName],
		returnValue: "resultRows",
		rowMode: "object",
	}) as any[];

	expect(tbl?.[0]?.name).toBe(tableName);
	expect(String(tbl?.[0]?.sql || "")).toMatch(/WITHOUT ROWID/);

	// Verify core indexes exist
	const idxRows = lix.sqlite.exec({
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
	createSchemaCacheTable({ runtime: { sqlite: lix.sqlite }, tableName });

	const idxRows2 = lix.sqlite.exec({
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
