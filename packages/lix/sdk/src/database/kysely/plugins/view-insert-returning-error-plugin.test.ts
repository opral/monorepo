import { test, expect } from "vitest";
import { openLix } from "../../../lix/open-lix.js";

test("should throw error when using returningAll() on view insert", async () => {
	const lix = await openLix({});

	// Test with a view that's in the plugin's view list
	expect(() => {
		lix.db.insertInto("change_set").defaultValues().returningAll().compile();
	}).toThrow(
		"Cannot use returning() or returningAll() with INSERT operations on view 'change_set'. " +
			"Views do not support returning clauses in INSERT statements. " +
			"Use a separate SELECT query after the INSERT to retrieve the data."
	);
});

test("should throw error when using returning() on view insert", async () => {
	const lix = await openLix({});

	// Test with returning() instead of returningAll()
	expect(() => {
		lix.db
			.insertInto("conversation")
			.values({ id: "test-id" })
			.returning("id")
			.compile();
	}).toThrow(
		"Cannot use returning() or returningAll() with INSERT operations on view 'conversation'. " +
			"Views do not support returning clauses in INSERT statements. " +
			"Use a separate SELECT query after the INSERT to retrieve the data."
	);
});

test("should allow insert without returning on views", async () => {
	const lix = await openLix({});

	// This should not throw
	expect(() => {
		lix.db.insertInto("change_set").defaultValues().compile();
	}).not.toThrow();
});

test("should allow returning on non-view tables", async () => {
	const lix = await openLix({});

	// This should not throw since 'state' is a table, not a view
	expect(() => {
		lix.db
			.insertInto("state_all")
			.values({
				entity_id: "test",
				schema_key: "test",
				file_id: "test",
				schema_version: "1.0",
				plugin_key: "test",
				snapshot_content: {},
				version_id: "test",
			})
			.returningAll()
			.compile();
	}).not.toThrow();
});
