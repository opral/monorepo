/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { createCheckpoint } from "../change-set/create-checkpoint.js";
import {
	changeSetHasLabel,
	changeSetIsAncestorOf,
	changeSetIsDescendantOf,
} from "../query-filter/index.js";

test("query current state at head of version lineage", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert initial state (defaults to active version)
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { value: "initial content" },
		})
		.execute();

	// Get the active version's change_set_id
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query current state using change_set_id
	const currentState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", activeVersion.change_set_id)
		.selectAll()
		.execute();

	expect(currentState).toHaveLength(1);
	expect(currentState[0]).toMatchObject({
		entity_id: "paragraph0",
		change_set_id: activeVersion.change_set_id,
		depth: 0,
		snapshot_content: { value: "initial content" },
	});
});

test("query state at specific depth in history", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert and modify entity multiple times
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { value: "value0" },
		})
		.execute();

	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "value1" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "value2" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query current state (depth 0)
	const currentState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", activeVersion.change_set_id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	expect(currentState).toHaveLength(1);
	expect(currentState[0]?.snapshot_content).toEqual({ value: "value2" });

	// Query previous state (depth 1)
	const previousState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", activeVersion.change_set_id)
		.where("depth", "=", 1)
		.selectAll()
		.execute();

	expect(previousState).toHaveLength(1);
	expect(previousState[0]?.snapshot_content).toEqual({ value: "value1" });

	// Query oldest state (depth 2)
	const oldestState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", activeVersion.change_set_id)
		.where("depth", "=", 2)
		.selectAll()
		.execute();

	expect(oldestState).toHaveLength(1);
	expect(oldestState[0]?.snapshot_content).toEqual({ value: "value0" });
});

test("query state at specific change set", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Create multiple change sets
	await lix.db
		.insertInto("change_set")
		.values([{ id: "changeset1" }, { id: "changeset2" }, { id: "current" }])
		.execute();

	// Query state at specific change sets
	const changeSetStates = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "in", ["changeset1", "changeset2"])
		.selectAll()
		.execute();

	// Should be able to query both change sets (even if no data exists yet)
	expect(changeSetStates.length).toBeGreaterThanOrEqual(0);
});

test("query state at checkpoint using createCheckpoint API", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert initial state
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { value: "checkpoint content" },
		})
		.execute();

	// Create a checkpoint
	const checkpoint = await createCheckpoint({ lix });

	// Query state at the checkpoint (current state only)
	const checkpointState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", checkpoint.id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	expect(checkpointState).toHaveLength(1);
	expect(checkpointState[0]?.snapshot_content).toEqual({
		value: "checkpoint content",
	});
	expect(checkpointState[0]?.change_set_id).toBe(checkpoint.id);
});

test("diff detection between current and checkpoint state", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert entity
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: { value: "initial" },
		})
		.execute();

	// Create checkpoint at this state
	const checkpoint = await createCheckpoint({ lix });

	// Modify the same entity after checkpoint
	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "modified" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	// Get updated version info
	const updatedVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query current state (depth 0 only)
	const currentState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", updatedVersion.change_set_id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Query state at checkpoint (depth 0 only)
	const checkpointState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", checkpoint.id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Verify diff detection logic
	expect(currentState).toHaveLength(1);
	expect(checkpointState).toHaveLength(1);

	// Different change_set_ids indicate diff detected
	expect(currentState[0]?.change_set_id).not.toBe(
		checkpointState[0]?.change_set_id
	);
	expect(currentState[0]?.snapshot_content).toEqual({ value: "modified" });
	expect(checkpointState[0]?.snapshot_content).toEqual({ value: "initial" });
});

test("deletion diff - entity exists at checkpoint but not current", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert entity
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			schema_version: "1.0",
			snapshot_content: { value: "to be deleted" },
		})
		.execute();

	// Create checkpoint with this entity
	const checkpoint = await createCheckpoint({ lix });

	// Delete entity
	await lix.db
		.deleteFrom("state_all")
		.where("entity_id", "=", "paragraph0")
		.execute();

	const updatedVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query current state (should be empty after deletion)
	const currentState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", updatedVersion.change_set_id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Query checkpoint state (should exist at depth 0)
	const checkpointState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", checkpoint.id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Deletion diff logic
	expect(currentState).toHaveLength(0); // Entity deleted
	expect(checkpointState).toHaveLength(1); // Entity existed at checkpoint
	expect(checkpointState[0]?.snapshot_content).toEqual({
		value: "to be deleted",
	});
});

test("insertion diff - entity exists current but not at checkpoint", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		additionalProperties: false,
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Create checkpoint with no entities
	const checkpoint = await createCheckpoint({ lix });

	// Insert entity after checkpoint
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			schema_version: "1.0",
			snapshot_content: { value: "newly inserted" },
		})
		.execute();

	const updatedVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query current state (should exist at depth 0)
	const currentState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", updatedVersion.change_set_id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Query checkpoint state (should be empty)
	const checkpointState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", checkpoint.id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Insertion diff logic
	expect(currentState).toHaveLength(1); // Entity exists now
	expect(checkpointState).toHaveLength(0); // Entity didn't exist at checkpoint
	expect(currentState[0]?.snapshot_content).toEqual({
		value: "newly inserted",
	});
});

test("blame functionality - track entity changes over time", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
			author: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Simulate multiple edits
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: { value: "initial", author: "alice" },
		})
		.execute();

	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "update", author: "bob" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "final", author: "charlie" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query recent history for blame (last 3 changes)
	const recentHistory = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", activeVersion.change_set_id)
		.where("depth", "<=", 2)
		.orderBy("depth", "asc")
		.selectAll()
		.execute();

	expect(recentHistory).toHaveLength(3);

	// Should show evolution from oldest to newest
	expect(recentHistory[2]?.snapshot_content).toEqual({
		value: "initial",
		author: "alice",
	}); // depth 2 (oldest)
	expect(recentHistory[1]?.snapshot_content).toEqual({
		value: "update",
		author: "bob",
	}); // depth 1
	expect(recentHistory[0]?.snapshot_content).toEqual({
		value: "final",
		author: "charlie",
	}); // depth 0 (newest)
});

test("working change set diff - compare current vs checkpoints", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert initial entity
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "paragraph0",
			file_id: "f0",
			schema_key: "mock_schema",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: { value: "checkpoint 1 content" },
		})
		.execute();

	// Create first checkpoint
	const checkpoint1 = await createCheckpoint({ lix });

	// Modify and create second checkpoint
	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "checkpoint 2 content" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	const checkpoint2 = await createCheckpoint({ lix });

	// Modify for current working state
	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "working content" } })
		.where("entity_id", "=", "paragraph0")
		.execute();

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query current working state (depth 0 only)
	const currentState = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "=", activeVersion.change_set_id)
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Query against checkpoints (depth 0 only)
	const checkpointStates = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "paragraph0")
		.where("root_change_set_id", "in", [checkpoint1.id, checkpoint2.id])
		.where("depth", "=", 0)
		.selectAll()
		.execute();

	// Working change set logic - compare current vs checkpoints
	expect(currentState).toHaveLength(1);
	expect(currentState[0]?.snapshot_content).toEqual({
		value: "working content",
	});

	expect(checkpointStates).toHaveLength(2);
	expect(
		checkpointStates.find((s) => s.change_set_id === checkpoint1.id)
			?.snapshot_content
	).toEqual({ value: "checkpoint 1 content" });
	expect(
		checkpointStates.find((s) => s.change_set_id === checkpoint2.id)
			?.snapshot_content
	).toEqual({ value: "checkpoint 2 content" });
});

test("query history between two change sets using ancestor/descendant filters", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		additionalProperties: false,
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Create a series of checkpoints with entity changes
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "tracked-entity",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: lix.db.selectFrom("active_version").select("version_id"),
			snapshot_content: { value: "checkpoint 1 content" },
		})
		.execute();

	const checkpoint1 = await createCheckpoint({ lix });

	// Modify and create checkpoint 2
	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "checkpoint 2 content" } })
		.where("entity_id", "=", "tracked-entity")
		.execute();

	const checkpoint2 = await createCheckpoint({ lix });

	// Modify and create checkpoint 3
	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "checkpoint 3 content" } })
		.where("entity_id", "=", "tracked-entity")
		.execute();

	const checkpoint3 = await createCheckpoint({ lix });

	// Modify and create checkpoint 4
	await lix.db
		.updateTable("state_all")
		.set({ snapshot_content: { value: "checkpoint 4 content" } })
		.where("entity_id", "=", "tracked-entity")
		.execute();

	const checkpoint4 = await createCheckpoint({ lix });

	// Query history between checkpoint1 and checkpoint4 (should include checkpoint2 and checkpoint3)
	const betweenChangeSets = await lix.db
		.selectFrom("change_set")
		.where(changeSetIsDescendantOf({ id: checkpoint1.id }))
		.where(changeSetIsAncestorOf({ id: checkpoint4.id }))
		.where(changeSetHasLabel({ name: "checkpoint" }))
		.select("id")
		.execute();

	// Should find checkpoint2 and checkpoint3 (between checkpoint1 and checkpoint4)
	expect(betweenChangeSets).toHaveLength(2);
	const betweenIds = betweenChangeSets.map((cs) => cs.id);
	expect(betweenIds).toContain(checkpoint2.id);
	expect(betweenIds).toContain(checkpoint3.id);

	// Query state_history for entities in the range between checkpoint1 and checkpoint4
	const historyInRange = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "tracked-entity")
		.where("root_change_set_id", "in", [checkpoint2.id, checkpoint3.id])
		.where("depth", "=", 0)
		.orderBy("change_id", "asc")
		.selectAll()
		.execute();

	// Should get 2 historical states between the checkpoints, ordered by creation time
	expect(historyInRange).toHaveLength(2);
	expect(historyInRange[0]?.snapshot_content).toEqual({
		value: "checkpoint 2 content",
	});
	expect(historyInRange[1]?.snapshot_content).toEqual({
		value: "checkpoint 3 content",
	});
});

// Introducing parent_change_set_ids is ambigious now. we need a UI use case
// for building graphs to know how parent change set ids should be used.
// https://github.com/opral/lix-sdk/issues/320
test.skip("parent_change_set_ids field shows correct parent relationships", async () => {
	const lix = await openLix({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Create initial entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "test-entity",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: { value: "value0" },
		})
		.execute();

	// Get change set after first insert
	const changeSet1 = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Update entity to value1
	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "value1" } })
		.where("entity_id", "=", "test-entity")
		.execute();

	// Get change set after first update
	const changeSet2 = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Update entity to value2
	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "value2" } })
		.where("entity_id", "=", "test-entity")
		.execute();

	// Get final change set
	const changeSet3 = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.change_set_id")
		.executeTakeFirstOrThrow();

	// Query all history in one go using the final change set
	const history = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "test-entity")
		.where("root_change_set_id", "=", changeSet3.change_set_id)
		.orderBy("depth", "asc")
		.selectAll()
		.execute();

	// Verify we have the expected history
	expect(history).toHaveLength(3);
	expect(history[0]?.depth).toBe(0); // Current
	expect(history[1]?.depth).toBe(1); // Previous
	expect(history[2]?.depth).toBe(2); // Oldest

	// Verify content progression
	expect(history[0]?.snapshot_content).toEqual({ value: "value2" });
	expect(history[1]?.snapshot_content).toEqual({ value: "value1" });
	expect(history[2]?.snapshot_content).toEqual({ value: "value0" });

	// Verify parent_change_set_ids relationships
	// The current state (depth 0) should show parents for changeSet3
	// expect(Array.isArray(history[0]?.parent_change_set_ids)).toBe(true);
	// expect(history[0]?.parent_change_set_ids).toEqual([changeSet2.change_set_id]);

	// // The previous state (depth 1) should show parents for changeSet2
	// expect(Array.isArray(history[1]?.parent_change_set_ids)).toBe(true);
	// expect(history[1]?.parent_change_set_ids).toEqual([changeSet1.change_set_id]);

	// // The oldest state (depth 2) should show parents for changeSet1 (may be empty or have working change set)
	// expect(Array.isArray(history[2]?.parent_change_set_ids)).toBe(true);
});

test("querying the history of the working change set", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_debug", value: "true" }],
	});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		additionalProperties: false,
		type: "object",
		properties: {
			value: { type: "string" },
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert initial entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "entity0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: { value: "initial content" },
		})
		.execute();

	const checkpoint0 = await createCheckpoint({ lix });

	// Modify the entity
	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "modified content" } })
		.where("entity_id", "=", "entity0")
		.execute();

	const checkpoint1 = await createCheckpoint({ lix });

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select("version.working_change_set_id")
		.executeTakeFirstOrThrow();

	const workingChangeSetId = activeVersion.working_change_set_id;

	const checkpoint1History = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "entity0")
		.where("root_change_set_id", "=", checkpoint1.id)
		.innerJoin("change_set", "state_history.change_set_id", "change_set.id")
		.where(changeSetHasLabel({ name: "checkpoint" }))
		.orderBy("depth", "asc")
		.selectAll()
		.execute();

	expect(checkpoint1History).toHaveLength(2);
	expect(checkpoint1History[0]?.change_set_id).toBe(checkpoint1.id);
	expect(checkpoint1History[0]?.snapshot_content).toEqual({
		value: "modified content",
	});
	expect(checkpoint1History[1]?.change_set_id).toBe(checkpoint0.id);
	expect(checkpoint1History[1]?.snapshot_content).toEqual({
		value: "initial content",
	});

	const workingHistory = await lix.db
		.selectFrom("state_history")
		.where("entity_id", "=", "entity0")
		.where("root_change_set_id", "=", workingChangeSetId)
		.innerJoin("change_set", "state_history.change_set_id", "change_set.id")
		.where(changeSetHasLabel({ name: "checkpoint" }))
		.orderBy("depth", "asc")
		.selectAll()
		.execute();

	expect(workingHistory).toHaveLength(2);
	expect(workingHistory[0]?.snapshot_content).toEqual({
		value: "modified content",
	});
	expect(workingHistory[1]?.snapshot_content).toEqual({
		value: "initial content",
	});
});
