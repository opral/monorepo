import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";

test("inserting into vtable creates per-schema physical table", async () => {
	// Open Lix in memory
	const lix = await openLix({});

	// Insert a row with schema_key = 'test_schema' using Kysely
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_state_cache_v2")
		.values({
			entity_id: "entity1",
			schema_key: "test_schema",
			file_id: "file1",
			version_id: "v1",
			plugin_key: "plugin1",
			snapshot_content: sql`jsonb(${JSON.stringify({ test: "data" })})`,
			schema_version: "1.0",
			created_at: "2024-01-01",
			updated_at: "2024-01-01",
			inherited_from_version_id: null,
			inheritance_delete_marker: 0,
			change_id: null,
			commit_id: null,
		})
		.execute();

	// Check that physical table was created
	const physicalTableExists = lix.sqlite.exec({
		sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='internal_state_cache_test_schema'`,
		returnValue: "resultRows",
	});
	expect(physicalTableExists).toHaveLength(1);

	// Verify the row was inserted into the physical table
	const rows = lix.sqlite.exec({
		sql: `SELECT *, json(snapshot_content) as snapshot_json FROM internal_state_cache_test_schema`,
		returnValue: "resultRows",
		rowMode: "object",
	});
	expect(rows).toHaveLength(1);
	expect(rows[0]).toMatchObject({
		entity_id: "entity1",
		file_id: "file1",
		version_id: "v1",
		plugin_key: "plugin1",
		schema_version: "1.0",
		// snapshot_content is stored as BLOB, verify through snapshot_json
		snapshot_json: JSON.stringify({ test: "data" }),
	});
});
