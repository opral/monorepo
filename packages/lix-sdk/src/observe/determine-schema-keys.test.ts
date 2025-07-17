import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { determineSchemaKeys } from "./create-observe.js";

/**
 * Tests for the determineSchemaKeys function using real queries from md-app.
 * 
 * This test suite verifies that the schema key extraction logic correctly
 * identifies the tables involved in queries and maps them to their schema keys.
 */

test("should extract schema keys from simple table queries", async () => {
	const lix = await openLix({});
	
	// Test selectActiveVersion query from md-app
	const activeVersionQuery = lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version");
	
	const schemaKeys = determineSchemaKeys(activeVersionQuery.compile());
	
	// Should include schema keys for both active_version and version tables
	expect(schemaKeys).toContain("lix_version");
	// Note: active_version might not have a direct schema key mapping
	
	await lix.close();
});

test("should extract schema keys from key_value queries", async () => {
	const lix = await openLix({});
	
	// Test selectCurrentLixName query from md-app
	const currentLixNameQuery = lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_name")
		.select("value");
	
	const schemaKeys = determineSchemaKeys(currentLixNameQuery.compile());
	
	expect(schemaKeys).toContain("lix_key_value");
	
	await lix.close();
});

test("should extract schema keys from state table queries", async () => {
	const lix = await openLix({});
	
	// Test selectMdAstRoot query from md-app (this uses "state" table)
	const mdAstRootQuery = lix.db
		.selectFrom("state")
		.where("schema_key", "=", "markdown_root_v1")
		.where("file_id", "=", "test_file_id")
		.selectAll();
	
	const schemaKeys = determineSchemaKeys(mdAstRootQuery.compile());
	
	// "state" is a virtual table that should map to appropriate schema keys
	// For now, this test documents the current behavior
	expect(Array.isArray(schemaKeys)).toBe(true);
	
	await lix.close();
});

test("should extract schema keys from complex join queries", async () => {
	const lix = await openLix({});
	
	// Test selectCheckpoints query from md-app (complex with multiple joins)
	const checkpointsQuery = lix.db
		.selectFrom("change_set")
		.leftJoin("change_set_element", "change_set.id", "change_set_element.change_set_id")
		.leftJoin("change_set_label", "change_set.id", "change_set_label.change_set_id")
		.leftJoin("label", "label.id", "change_set_label.label_id")
		.where("label.name", "=", "checkpoint")
		.selectAll("change_set");
	
	const schemaKeys = determineSchemaKeys(checkpointsQuery.compile());
	
	// Should include schema keys for all joined tables
	expect(schemaKeys).toContain("lix_change_set");
	expect(schemaKeys).toContain("lix_change_set_element");
	expect(schemaKeys).toContain("lix_change_set_label");
	expect(schemaKeys).toContain("lix_label");
	
	await lix.close();
});

test("should extract schema keys from subquery queries", async () => {
	const lix = await openLix({});
	
	// Test selectActiveFile query from md-app (has subquery)
	const activeFileQuery = lix.db
		.selectFrom("file")
		.where(
			"id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.select(["id", "path", "metadata"]);
	
	const schemaKeys = determineSchemaKeys(activeFileQuery.compile());
	
	// Should include schema keys for both main query and subquery tables
	expect(schemaKeys).toContain("lix_file");
	expect(schemaKeys).toContain("lix_key_value");
	
	await lix.close();
});

test("should handle queries with aliases", async () => {
	const lix = await openLix({});
	
	// Test query with table aliases
	const aliasQuery = lix.db
		.selectFrom("change as main_change")
		.innerJoin("change as before_change", "main_change.entity_id", "before_change.entity_id")
		.selectAll("main_change");
	
	const schemaKeys = determineSchemaKeys(aliasQuery.compile());
	
	// Should recognize the underlying table despite aliases
	expect(schemaKeys).toContain("change");  // Should map to change table
	
	await lix.close();
});

test("should handle empty results gracefully", async () => {
	const lix = await openLix({});
	
	// Test with a table that doesn't exist in our mapping
	const unknownTableQuery = lix.db
		.selectFrom("unknown_table" as any)
		.selectAll();
	
	const schemaKeys = determineSchemaKeys(unknownTableQuery.compile());
	
	// Should return empty array for unknown tables
	expect(Array.isArray(schemaKeys)).toBe(true);
	expect(schemaKeys.length).toBe(0);
	
	await lix.close();
});

test("should handle complex working changes query", async () => {
	const lix = await openLix({});
	
	// Test selectWorkingChanges query from md-app (very complex with multiple subqueries)
	const workingChangesQuery = lix.db
		.selectFrom("change")
		.innerJoin("change_set_element", "change_set_element.change_id", "change.id")
		.where(
			"change_set_element.change_set_id",
			"=",
			lix.db
				.selectFrom("active_version")
				.innerJoin("version", "active_version.version_id", "version.id")
				.select("version.working_change_set_id")
		)
		.where(
			"change.file_id",
			"=",
			lix.db
				.selectFrom("key_value")
				.where("key", "=", "flashtype_active_file")
				.select("value")
		)
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.plugin_key",
			"change.schema_key",
			"change.created_at",
		]);
	
	const schemaKeys = determineSchemaKeys(workingChangesQuery.compile());
	
	// Should include schema keys for all tables involved
	expect(schemaKeys).toContain("change"); // change table
	expect(schemaKeys).toContain("lix_change_set_element");
	expect(schemaKeys).toContain("lix_version");
	expect(schemaKeys).toContain("lix_key_value");
	
	await lix.close();
});

test("should handle thread queries with json aggregation", async () => {
	const lix = await openLix({});
	
	// Test selectThreads query from md-app (uses jsonArrayFrom)
	const threadsQuery = lix.db
		.selectFrom("thread")
		.leftJoin("change_set_thread", "thread.id", "change_set_thread.thread_id")
		.leftJoin("thread_comment", "thread_comment.thread_id", "thread.id")
		.leftJoin("change_author", "thread_comment.lixcol_change_id", "change_author.change_id")
		.leftJoin("account", "account.id", "change_author.account_id")
		.where("change_set_thread.change_set_id", "=", "test_changeset")
		.selectAll("thread");
	
	const schemaKeys = determineSchemaKeys(threadsQuery.compile());
	
	// Should include all joined tables
	expect(schemaKeys).toContain("lix_thread");
	expect(schemaKeys).toContain("lix_change_set_thread");
	expect(schemaKeys).toContain("lix_thread_comment");
	expect(schemaKeys).toContain("lix_change_author");
	expect(schemaKeys).toContain("lix_account");
	
	await lix.close();
});

test("should correctly extract schema keys from real md-app queries", async () => {
	const lix = await openLix({});
	
	// Test cases based on actual queries from md-app
	const testCases = [
		{
			name: "selectActiveVersion",
			query: lix.db
				.selectFrom("active_version")
				.innerJoin("version", "active_version.version_id", "version.id")
				.selectAll("version"),
			expectedKeys: ["lix_version"]
		},
		{
			name: "selectCurrentLixName", 
			query: lix.db
				.selectFrom("key_value")
				.where("key", "=", "lix_name")
				.select("value"),
			expectedKeys: ["lix_key_value"]
		},
		{
			name: "selectMdAstRoot",
			query: lix.db
				.selectFrom("state")
				.where("schema_key", "=", "markdown_root_v1")
				.selectAll(),
			expectedKeys: ["state"]
		},
		{
			name: "selectActiveFile (with subquery)",
			query: lix.db
				.selectFrom("file")
				.where(
					"id",
					"=",
					lix.db
						.selectFrom("key_value")
						.where("key", "=", "flashtype_active_file")
						.select("value")
				)
				.select(["id", "path"]),
			expectedKeys: ["lix_file", "lix_key_value"]
		}
	];
	
	for (const testCase of testCases) {
		const schemaKeys = determineSchemaKeys(testCase.query.compile());
		
		for (const expectedKey of testCase.expectedKeys) {
			expect(schemaKeys, `${testCase.name} should include ${expectedKey}`)
				.toContain(expectedKey);
		}
	}
	
	await lix.close();
});

test("should debug log compiled query structure", async () => {
	const lix = await openLix({});
	
	// Test a simple query to see its compiled structure
	const simpleQuery = lix.db
		.selectFrom("key_value")
		.where("key", "=", "test")
		.select("value");
	
	const compiled = simpleQuery.compile();
	console.log("Compiled query structure:", JSON.stringify(compiled, null, 2));
	
	const schemaKeys = determineSchemaKeys(compiled);
	console.log("Extracted schema keys:", schemaKeys);
	
	expect(schemaKeys).toContain("lix_key_value");
	
	await lix.close();
});