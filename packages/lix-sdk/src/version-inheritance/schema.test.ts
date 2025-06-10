import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "../version/create-version.js";

test("version_inheritance view should show parent-child relationships", async () => {
	const lix = await openLixInMemory({});

	// Create change sets for versions
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "parent_cs" },
			{ id: "child_cs" },
			{ id: "parent_working" },
			{ id: "child_working" },
		])
		.execute();

	// Create parent version
	await lix.db
		.insertInto("version")
		.values({
			id: "parent",
			name: "parent",
			change_set_id: "parent_cs",
			working_change_set_id: "parent_working",
		})
		.execute();

	// Create child version
	await lix.db
		.insertInto("version")
		.values({
			id: "child",
			name: "child",
			change_set_id: "child_cs",
			working_change_set_id: "child_working",
		})
		.execute();

	// Set up inheritance relationship
	await lix.db
		.insertInto("version_inheritance")
		.values({
			parent_version_id: "parent",
			child_version_id: "child",
		})
		.execute();

	// Query version_inheritance view for the specific manual relationship
	const inheritance = await lix.db
		.selectFrom("version_inheritance")
		.where("child_version_id", "=", "child")
		.where("parent_version_id", "=", "parent")
		.selectAll()
		.execute();

	expect(inheritance).toContainEqual({
		parent_version_id: "parent",
		child_version_id: "child",
		version_id: "global",
	});
});

test("new versions should automatically inherit from global by default", async () => {
	const lix = await openLixInMemory({});

	// Create a version using createVersion function
	const newVersion = await createVersion({
		lix,
		name: "test-version",
	});

	// Check that it inherits from global
	const inheritance = await lix.db
		.selectFrom("version_inheritance")
		.where("child_version_id", "=", newVersion.id)
		.selectAll()
		.execute();

	expect(inheritance).toHaveLength(1);
	expect(inheritance[0]).toMatchObject({
		child_version_id: newVersion.id,
		parent_version_id: "global",
	});
});

test("version_inheritance should support multi-level inheritance", async () => {
	const lix = await openLixInMemory({});

	// Create parent version (will auto-inherit from global)
	const parentVersion = await createVersion({
		lix,
		name: "parent-version",
	});

	// Create child version (will auto-inherit from global)
	const childVersion = await createVersion({
		lix,
		name: "child-version",
	});

	// Manually add child -> parent relationship (in addition to both inheriting from global)
	await lix.db
		.insertInto("version_inheritance")
		.values({
			child_version_id: childVersion.id,
			parent_version_id: parentVersion.id,
		})
		.execute();

	// Query inheritance relationships
	const inheritance = await lix.db
		.selectFrom("version_inheritance")
		.orderBy("child_version_id")
		.select(["child_version_id", "parent_version_id"])
		.execute();

	// Should have parent -> global (auto-inheritance)
	expect(inheritance).toContainEqual({
		child_version_id: parentVersion.id,
		parent_version_id: "global",
	});

	// Should have child -> global (auto-inheritance)
	expect(inheritance).toContainEqual({
		child_version_id: childVersion.id,
		parent_version_id: "global",
	});

	// Should have child -> parent (manual relationship)
	expect(inheritance).toContainEqual({
		child_version_id: childVersion.id,
		parent_version_id: parentVersion.id,
	});
});

test("version_inheritance should prevent circular inheritance", async () => {
	const lix = await openLixInMemory({});

	// Create change sets
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "v1_cs", version_id: "global" },
			{ id: "v2_cs", version_id: "global" },
			{ id: "v1_working", version_id: "global" },
			{ id: "v2_working", version_id: "global" },
		])
		.execute();

	// Create two versions
	await lix.db
		.insertInto("version")
		.values([
			{
				id: "v1",
				name: "version1",
				change_set_id: "v1_cs",
				working_change_set_id: "v1_working",
			},
			{
				id: "v2",
				name: "version2",
				change_set_id: "v2_cs",
				working_change_set_id: "v2_working",
			},
		])
		.execute();

	// Set up initial inheritance: v2 inherits from v1
	await lix.db
		.insertInto("version_inheritance")
		.values({
			child_version_id: "v2",
			parent_version_id: "v1",
		})
		.execute();

	// Attempt to create circular inheritance: v1 -> v2 -> v1
	await expect(
		lix.db
			.insertInto("version_inheritance")
			.values({
				child_version_id: "v1",
				parent_version_id: "v2",
			})
			.execute()
	).rejects.toThrow(/circular inheritance/i);
});

test("querying state should union inherited data", async () => {
	const lix = await openLixInMemory({});

	// Create global version with some state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "global_entity",
			version_id: "global",
			snapshot_content: { type: "global", value: "from_global" },
			schema_key: "test_schema",
			file_id: "test_file",
			plugin_key: "test_plugin",
			schema_version: "1.0",
		})
		.execute();

	// Create child version that inherits from global
	const childVersion = await createVersion({
		lix,
		name: "child-version",
	});

	// Add child-specific state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "child_entity",
			version_id: childVersion.id,
			snapshot_content: { type: "child", value: "from_child" },
			schema_key: "test_schema",
			file_id: "test_file",
			plugin_key: "test_plugin",
			schema_version: "1.0",
		})
		.execute();

	// Switch to child version and query state
	await lix.db
		.updateTable("active_version")
		.set({ version_id: childVersion.id })
		.execute();

	// Query should return union of global + child state
	const state = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "test_schema")
		.where("entity_id", "in", ["global_entity", "child_entity"])
		.selectAll()
		.orderBy("entity_id")
		.execute();

	expect(state).toHaveLength(2);
	expect(state).toContainEqual(
		expect.objectContaining({
			entity_id: "global_entity",
			snapshot_content: { type: "global", value: "from_global" },
		})
	);
	expect(state).toContainEqual(
		expect.objectContaining({
			entity_id: "child_entity",
			snapshot_content: { type: "child", value: "from_child" },
		})
	);
});

test("child state should override parent state for same entity", async () => {
	const lix = await openLixInMemory({});

	// Create global state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "shared_entity",
			version_id: "global",
			snapshot_content: { source: "global" },
			schema_key: "test_schema",
			file_id: "test_file",
			plugin_key: "test_plugin",
			schema_version: "1.0",
		})
		.execute();

	// Create child version
	const childVersion = await createVersion({
		lix,
		name: "child-version",
	});

	// Override with child state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "shared_entity",
			version_id: childVersion.id,
			snapshot_content: { source: "child" },
			schema_key: "test_schema",
			file_id: "test_file",
			plugin_key: "test_plugin",
			schema_version: "1.0",
		})
		.execute();

	// Query should return child's version (override)
	const childState = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "shared_entity")
		.where("schema_key", "=", "test_schema")
		.where("version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(childState).toHaveLength(1);
	expect(childState[0]).toMatchObject({
		entity_id: "shared_entity",
		snapshot_content: { source: "child" },
	});

	const globalState = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "shared_entity")
		.where("schema_key", "=", "test_schema")
		.where("version_id", "=", "global")
		.selectAll()
		.execute();
	expect(globalState).toHaveLength(1);
	expect(globalState[0]).toMatchObject({
		entity_id: "shared_entity",
		snapshot_content: { source: "global" },
	});
});

test("global version should exist after schema initialization", async () => {
	const lix = await openLixInMemory({});

	// Global version should be created automatically
	const globalVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirst();

	expect(globalVersion).toBeDefined();
	expect(globalVersion?.name).toBe("global");

	// Global version should not inherit from anything
	const globalInheritance = await lix.db
		.selectFrom("version_inheritance")
		.where("child_version_id", "=", "global")
		.selectAll()
		.execute();

	expect(globalInheritance).toHaveLength(0);
});

test("version_inheritance view should handle version deletion", async () => {
	const lix = await openLixInMemory({});

	// Create child version
	const childVersion = await createVersion({
		lix,
		name: "test-child",
	});

	// Verify inheritance exists
	const inheritanceBefore = await lix.db
		.selectFrom("version_inheritance")
		.where("child_version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(inheritanceBefore).toHaveLength(1);

	// Delete the child version
	await lix.db
		.deleteFrom("version")
		.where("id", "=", childVersion.id)
		.execute();

	// Inheritance relationship should be gone
	const inheritanceAfter = await lix.db
		.selectFrom("version_inheritance")
		.where("child_version_id", "=", childVersion.id)
		.selectAll()
		.execute();

	expect(inheritanceAfter).toHaveLength(0);
});
