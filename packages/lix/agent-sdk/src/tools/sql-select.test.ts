import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { sqlSelect } from "./sql-select.js";

async function getActiveVersionId(lix: Awaited<ReturnType<typeof openLix>>) {
	const active = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();
	return active.version_id as unknown as string;
}

test("should execute a simple SELECT query", async () => {
	const lix = await openLix({});
	const versionId = await getActiveVersionId(lix);

	const result = await sqlSelect({
		lix,
		sql: `SELECT version_id FROM active_version LIMIT 1`,
	});

	expect(Array.isArray(result)).toBe(true);
	expect(result.length).toBeGreaterThan(0);
	expect(result[0]).toHaveProperty("version_id");
});

test("should query state_all view", async () => {
	const lix = await openLix({});
	const versionId = await getActiveVersionId(lix);

	// Insert a test entity
	await lix.db
		.insertInto("file_all")
		.values({
			path: "/test.md",
			data: new TextEncoder().encode("test content"),
			lixcol_version_id: versionId as any,
		})
		.execute();

	const result = await sqlSelect({
		lix,
		sql: `SELECT entity_id, schema_key, file_id FROM state_all WHERE version_id = '${versionId}' LIMIT 10`,
	});

	expect(Array.isArray(result)).toBe(true);
});

test("should support WITH (CTE) queries", async () => {
	const lix = await openLix({});

	const result = await sqlSelect({
		lix,
		sql: `
			WITH active AS (
				SELECT version_id FROM active_version
			)
			SELECT * FROM active LIMIT 1
		`,
	});

	expect(Array.isArray(result)).toBe(true);
	expect(result.length).toBeGreaterThan(0);
});

test("should reject non-SELECT statements", async () => {
	const lix = await openLix({});

	await expect(
		sqlSelect({
			lix,
			sql: "INSERT INTO active_version (version_id) VALUES ('test')",
		})
	).rejects.toThrow("only SELECT queries are allowed");
});

test("should reject multiple statements", async () => {
	const lix = await openLix({});

	await expect(
		sqlSelect({
			lix,
			sql: "SELECT * FROM active_version; DROP TABLE active_version;",
		})
	).rejects.toThrow("only a single SELECT statement is allowed");
});

test("should return empty array for no results", async () => {
	const lix = await openLix({});
	const versionId = await getActiveVersionId(lix);

	const result = await sqlSelect({
		lix,
		sql: `SELECT * FROM state_all WHERE version_id = '${versionId}' AND schema_key = 'nonexistent_schema' LIMIT 10`,
	});

	expect(Array.isArray(result)).toBe(true);
	expect(result.length).toBe(0);
});

test("should support JSON extraction", async () => {
	const lix = await openLix({});

	// Query stored schemas which have JSON content
	const result = await sqlSelect({
		lix,
		sql: `
			SELECT 
				json_extract(value, '$."x-lix-key"') as schema_key
			FROM stored_schema
			LIMIT 5
		`,
	});

	expect(Array.isArray(result)).toBe(true);
	if (result.length > 0) {
		expect(result[0]).toHaveProperty("schema_key");
	}
});
