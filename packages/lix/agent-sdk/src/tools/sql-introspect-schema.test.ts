import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { sqlIntrospectSchema } from "./sql-introspect-schema.js";

test("should return available views and schema keys", async () => {
	const lix = await openLix({});

	const result = await sqlIntrospectSchema({ lix });

	expect(result).toHaveProperty("views");
	expect(result).toHaveProperty("schema_keys");

	// Verify we have 3 views (state_all, state_history, change)
	expect(result.views).toHaveLength(3);
	expect(result.views[0]?.name).toBe("state_all");
	expect(result.views[1]?.name).toBe("state_history");
	expect(result.views[2]?.name).toBe("change");

	expect(Array.isArray(result.schema_keys)).toBe(true);
});

test("should return views with detailed structure", async () => {
	const lix = await openLix({});

	const result = await sqlIntrospectSchema({ lix });

	expect(Array.isArray(result.views)).toBe(true);
	expect(result.views.length).toBeGreaterThan(0);

	for (const view of result.views) {
		expect(view).toHaveProperty("name");
		expect(view).toHaveProperty("type");
		expect(view).toHaveProperty("description");
		expect(view).toHaveProperty("columns");
		expect(view).toHaveProperty("example_query");

		expect(view.type).toBe("view");
		expect(typeof view.description).toBe("string");
		expect(Array.isArray(view.columns)).toBe(true);
		expect(view.columns.length).toBeGreaterThan(0);
		expect(typeof view.example_query).toBe("string");
	}
});

test("should query and return stored schema keys", async () => {
	const lix = await openLix({});

	const result = await sqlIntrospectSchema({ lix });

	expect(Array.isArray(result.schema_keys)).toBe(true);
	// Should at least include the lix internal schemas
	expect(result.schema_keys.length).toBeGreaterThan(0);
});

test("should include expected columns for each view", async () => {
	const lix = await openLix({});

	const result = await sqlIntrospectSchema({ lix });

	// Check state_all has key columns
	const stateAll = result.views.find((v) => v.name === "state_all");
	expect(stateAll).toBeDefined();
	expect(stateAll?.columns).toContain("entity_id");
	expect(stateAll?.columns).toContain("schema_key");
	expect(stateAll?.columns).toContain("snapshot_content");
	expect(stateAll?.columns).toContain("version_id");

	// Check state_history has depth column
	const stateHistory = result.views.find((v) => v.name === "state_history");
	expect(stateHistory).toBeDefined();
	expect(stateHistory?.columns).toContain("depth");
	expect(stateHistory?.columns).toContain("root_commit_id");

	// Check change view has id and created_at
	const changeView = result.views.find((v) => v.name === "change");
	expect(changeView).toBeDefined();
	expect(changeView?.columns).toContain("id");
	expect(changeView?.columns).toContain("created_at");
});
