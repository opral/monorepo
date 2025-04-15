import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { createChangeSet } from "./create-change-set.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";
import { changeSetHasLabel } from "../query-filter/change-set-has-label.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";

test("creates a checkpoint that has an edge to the version's change set", async () => {
	// Create a Lix instance with the mockJsonPlugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Get the initial version and its change set
	const initialVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.select(["version_v2.id as id", "version_v2.change_set_id"])
		.executeTakeFirstOrThrow();

	// Create a checkpoint
	const checkpoint = await createCheckpoint({ lix });

	// Verify the checkpoint has an edge to the version's change set
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.select(["parent_id", "child_id"])
		.execute();

	// Should have exactly one edge
	expect(edges.length).toBe(1);

	// Verify the edge connects to the version's change set
	const edgeToVersionChangeSet = edges.find(
		(edge) => edge.parent_id === initialVersion.change_set_id
	);
	expect(edgeToVersionChangeSet).toBeDefined();
	expect(edgeToVersionChangeSet?.parent_id).toBe(initialVersion.change_set_id);
	expect(edgeToVersionChangeSet?.child_id).toBe(checkpoint.id);

	// Verify the checkpoint has the checkpoint label
	const labels = await lix.db
		.selectFrom("change_set_label")
		.innerJoin("label", "label.id", "change_set_label.label_id")
		.where("change_set_label.change_set_id", "=", checkpoint.id)
		.select(["label.name"])
		.execute();

	expect(labels.map((l) => l.name)).toContain("checkpoint");
});

// this is a potential future optimization of being able to disregard
// change sets between two checkpoints once every client (reasonably) synced
test.skip("creates a checkpoint with edges to both the version's change set AND the previous checkpoint", async () => {
	// Create a Lix instance with the mockJsonPlugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Get the initial version
	const initialVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.select(["version_v2.id as id", "version_v2.change_set_id"])
		.executeTakeFirstOrThrow();

	// Create first checkpoint
	const firstCheckpoint = await createCheckpoint({ lix });

	// Create a change set after the first checkpoint
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a snapshot
	const snapshot = await lix.db
		.insertInto("snapshot")
		.values({
			content: { value: "Test Value" },
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change
	const change = await lix.db
		.insertInto("change")
		.values({
			id: "c1",
			file_id: file.id,
			plugin_key: mockJsonPlugin.key,
			entity_id: "e1",
			schema_key: "mock_json_property",
			snapshot_id: snapshot.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set with the change
	const changeSet = await createChangeSet({
		lix,
		elements: [
			{
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			},
		],
		parents: [{ id: firstCheckpoint.id }],
	});

	// Update the version to point to the new change set
	await lix.db
		.updateTable("version_v2")
		.set({ change_set_id: changeSet.id })
		.where("id", "=", initialVersion.id)
		.execute();

	// Create second checkpoint
	const secondCheckpoint = await createCheckpoint({ lix });

	// Verify the second checkpoint has two edges:
	// 1. To the change set that was current before creating the checkpoint
	// 2. To the first checkpoint
	const edges = await lix.db
		.selectFrom("change_set_edge")
		.where("child_id", "=", secondCheckpoint.id)
		.select(["parent_id", "child_id"])
		.execute();

	// There should be exactly 2 edges
	expect(edges.length).toBe(2);

	// Verify these are the edges we expect
	const edgeToChangeSet = edges.find((edge) => edge.parent_id === changeSet.id);
	const edgeToFirstCheckpoint = edges.find(
		(edge) => edge.parent_id === firstCheckpoint.id
	);

	expect(edgeToChangeSet).toBeDefined();
	expect(edgeToFirstCheckpoint).toBeDefined();

	// Verify the version now points to the second checkpoint
	const updatedVersion = await lix.db
		.selectFrom("version_v2")
		.where("id", "=", initialVersion.id)
		.select(["change_set_id"])
		.executeTakeFirstOrThrow();

	expect(updatedVersion.change_set_id).toBe(secondCheckpoint.id);
});

test("only contains the leaf change diff (not all) to the compared to the previous checkpoint", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(`{ "name": "Max", "age": 25 }`),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await fileQueueSettled({ lix });

	// should contain the file insert and name max change
	const checkpoint1 = await createCheckpoint({ lix });

	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode(`{ "name": "Julia", "age": 25 }`) })
		.execute();

	await fileQueueSettled({ lix });

	const checkpoint2 = await createCheckpoint({ lix });

	const changesCheckpoint1 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", checkpoint1.id)
		.where("change_set_element.schema_key", "=", "mock_json_property")
		.orderBy("change_set_element.entity_id asc")
		.select([
			"change_set_element.entity_id",
			"change_set_element.schema_key",
			"change_set_element.file_id",
		])
		.execute();

	const changesCheckpoint2 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", checkpoint2.id)
		.where("change_set_element.schema_key", "=", "mock_json_property")
		.select([
			"change_set_element.entity_id",
			"change_set_element.schema_key",
			"change_set_element.file_id",
		])
		.orderBy("change_set_element.entity_id asc")
		.execute();

	// both age and name have been modified before creating the checkpoint
	expect(changesCheckpoint1).toEqual([
		{
			file_id: "file1",
			schema_key: "mock_json_property",
			entity_id: "age",
		},
		{
			file_id: "file1",
			schema_key: "mock_json_property",
			entity_id: "name",
		},
	]);

	// only name has been modified before creating checkpoint 2
	expect(changesCheckpoint2).toEqual([
		{
			file_id: "file1",
			schema_key: "mock_json_property",
			entity_id: "name",
		},
	]);
});

test("handles own change control changes", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock_test",
			value: "hello world",
		})
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where("change.schema_key", "=", "lix_key_value_table")
		.select(["id"])
		.execute();

	expect(changes).toHaveLength(1);

	// checkpoint contains the key value update
	const checkpoint = await createCheckpoint({
		lix,
	});

	const checkpointElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", checkpoint.id)
		.where("schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	expect(checkpointElements).toHaveLength(1);
});

test("creating multiple subsequent checkpoints leads to connected edges", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock_test",
			value: "hello world",
		})
		.execute();

	const checkpoint0 = await createCheckpoint({
		lix,
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.selectAll("version_v2")
		.executeTakeFirstOrThrow();

	expect(activeVersion.change_set_id).toBe(checkpoint0.id);

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", checkpoint0.id)
		.where("schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	expect(elements).toHaveLength(1);

	const workingChangeSetElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersion.working_change_set_id)
		.selectAll()
		.execute();

	expect(workingChangeSetElements).toHaveLength(0);

	await lix.db
		.updateTable("key_value")
		.set({ value: "hello world 2" })
		.where("key", "=", "mock_test")
		.execute();

	const checkpoint1 = await createCheckpoint({
		lix,
	});

	const parentCheckpoint = await lix.db
		.selectFrom("change_set")
		.where(changeSetHasLabel({ name: "checkpoint" }))
		.where(changeSetIsAncestorOf({ id: checkpoint1.id }))
		.select("id")
		.executeTakeFirstOrThrow();

	expect(parentCheckpoint.id).toBe(checkpoint0.id);
});
