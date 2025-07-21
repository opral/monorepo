import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { entityEquals, entityEqualsCanonical } from "./entity-equals.js";

test("entityEquals works with key_value view (lixcol_ columns)", async () => {
	const lix = await openLix({});

	// Insert a key-value pair
	await lix.db
		.insertInto("key_value")
		.values({
			key: "theme_mode",
			value: "dark",
		})
		.execute();

	const kvEntity = {
		entity_id: "theme_mode",
		schema_key: "lix_key_value",
		file_id: "lix",
	};

	// Query using entityEquals (for views with lixcol_ columns)
	const result = await lix.db
		.selectFrom("key_value")
		.where(entityEquals(kvEntity))
		.select([
			"key",
			"value",
			"lixcol_entity_id",
			"lixcol_schema_key",
			"lixcol_file_id",
		])
		.executeTakeFirst();

	expect(result).toBeDefined();
	expect(result?.key).toBe("theme_mode");
	expect(result?.value).toBe("dark");
	expect(result?.lixcol_entity_id).toBe("theme_mode");
	expect(result?.lixcol_schema_key).toBe("lix_key_value");
	expect(result?.lixcol_file_id).toBe("lix");
});

test("entityEquals works with table alias on key_value view", async () => {
	const lix = await openLix({});

	// Insert multiple key-value pairs
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "setting1", value: "enabled" },
			{ key: "setting2", value: "disabled" },
		])
		.execute();

	const targetEntity = {
		entity_id: "setting1",
		schema_key: "lix_key_value",
		file_id: "lix",
	};

	// Query with table alias
	const result = await lix.db
		.selectFrom("key_value as kv")
		.where(entityEquals(targetEntity, "kv"))
		.select(["kv.key", "kv.value"])
		.executeTakeFirst();

	expect(result).toBeDefined();
	expect(result?.key).toBe("setting1");
	expect(result?.value).toBe("enabled");
});

test("entityEqualsCanonical works with entity_label table", async () => {
	const lix = await openLix({});

	// Create a label first
	await lix.db
		.insertInto("label")
		.values({
			id: "label123",
			name: "important",
		})
		.execute();

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc123",
			schema_key: "document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc123", title: "Test Doc" },
		})
		.execute();

	// Add label to entity
	await lix.db
		.insertInto("entity_label")
		.values({
			entity_id: "doc123",
			schema_key: "document",
			file_id: "docs.json",
			label_id: "label123",
		})
		.execute();

	const entity = {
		entity_id: "doc123",
		schema_key: "document",
		file_id: "docs.json",
	};

	// Query using entityEqualsCanonical (for tables with canonical columns)
	const labels = await lix.db
		.selectFrom("entity_label")
		.where(entityEqualsCanonical(entity))
		.select(["label_id", "entity_id", "schema_key", "file_id"])
		.execute();

	expect(labels).toHaveLength(1);
	expect(labels[0]?.label_id).toBe("label123");
	expect(labels[0]?.entity_id).toBe("doc123");
});

test("entityEqualsCanonical works with state table", async () => {
	const lix = await openLix({});

	const entity = {
		entity_id: "task456",
		schema_key: "task",
		file_id: "tasks.json",
	};

	// Create entity in state
	await lix.db
		.insertInto("state")
		.values({
			...entity,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: {
				id: "task456",
				title: "Complete feature",
				status: "in_progress",
			},
		})
		.execute();

	// Query state using entityEqualsCanonical
	const stateEntry = await lix.db
		.selectFrom("state")
		.where(entityEqualsCanonical(entity))
		.select(["snapshot_content", "entity_id", "schema_key", "file_id"])
		.executeTakeFirst();

	expect(stateEntry).toBeDefined();
	expect(stateEntry?.entity_id).toBe("task456");
	expect(stateEntry?.snapshot_content).toMatchObject({
		id: "task456",
		title: "Complete feature",
		status: "in_progress",
	});
});

test("entityEqualsCanonical works with state_all table", async () => {
	const lix = await openLix({});

	const entity = {
		entity_id: "doc789",
		schema_key: "document",
		file_id: "docs.json",
	};

	// Create entity in state
	await lix.db
		.insertInto("state")
		.values({
			...entity,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: {
				id: "doc789",
				title: "Version 1",
			},
		})
		.execute();

	// Query state_all using entityEqualsCanonical
	const allVersions = await lix.db
		.selectFrom("state_all")
		.where(entityEqualsCanonical(entity))
		.select([
			"snapshot_content",
			"entity_id",
			"schema_key",
			"file_id",
			"created_at",
		])
		.orderBy("created_at", "asc")
		.execute();

	expect(allVersions.length).toBeGreaterThanOrEqual(1);
	expect(allVersions[0]?.entity_id).toBe("doc789");
	expect(allVersions[0]?.snapshot_content).toMatchObject({
		id: "doc789",
		title: "Version 1",
	});

	// Test that it filters correctly
	const wrongEntity = {
		entity_id: "nonexistent",
		schema_key: "document",
		file_id: "docs.json",
	};

	const noResults = await lix.db
		.selectFrom("state_all")
		.where(entityEqualsCanonical(wrongEntity))
		.select(["entity_id"])
		.execute();

	expect(noResults).toHaveLength(0);
});

test("entityEqualsCanonical works with state_history table", async () => {
	const lix = await openLix({});

	const entity = {
		entity_id: "item999",
		schema_key: "item",
		file_id: "items.json",
	};

	// Create entity in state
	await lix.db
		.insertInto("state")
		.values({
			...entity,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: {
				id: "item999",
				name: "Initial",
				count: 1,
			},
		})
		.execute();

	// Update the entity to create history
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				id: "item999",
				name: "Updated",
				count: 2,
			},
		})
		.where("entity_id", "=", entity.entity_id)
		.where("schema_key", "=", entity.schema_key)
		.where("file_id", "=", entity.file_id)
		.execute();

	// Query state_history using entityEqualsCanonical
	const history = await lix.db
		.selectFrom("state_history")
		.where(entityEqualsCanonical(entity))
		.where(
			"root_change_set_id",
			"=",
			lix.db
				.selectFrom("active_version")
				.innerJoin("version", "version_id", "active_version.version_id")
				.select("version.change_set_id")
		)
		.select(["snapshot_content", "entity_id", "schema_key", "file_id", "depth"])
		.orderBy("depth", "asc")
		.execute();

	expect(history).toEqual([
		{
			entity_id: "item999",
			schema_key: "item",
			file_id: "items.json",
			snapshot_content: {
				id: "item999",
				name: "Updated",
				count: 2,
			},
			depth: 0,
		},
		{
			entity_id: "item999",
			schema_key: "item",
			file_id: "items.json",
			snapshot_content: {
				id: "item999",
				name: "Initial",
				count: 1,
			},
			depth: 1,
		},
	]);
});
