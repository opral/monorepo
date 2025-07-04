import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import {
	mockJsonPlugin,
	MockJsonPropertySchema,
} from "../plugin/mock-json-plugin.js";
import { createChangeSet } from "./create-change-set.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createTransitionChangeSet } from "./create-transition-change-set.js";

// needs faster graph traversal. currently timing out.
// related https://github.com/opral/lix-sdk/issues/311
test.skip("it transitions state to a specific change set", async () => {
	// Create a Lix instance with our plugin
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert the schema that the mockJsonPlugin uses
	await lix.db
		.insertInto("stored_schema")
		.values({
			value: MockJsonPropertySchema,
		})
		.execute();

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(""),
			path: "/test.json",
		})
		.execute();

	const file = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("id", "=", "file1")
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "l0",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Value 0" },
			},
			{
				id: "c1",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "l1",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Value 1" },
			},
			{
				id: "c2",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "l2",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Value 2" },
			},
			{
				id: "c3",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "l2",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Value 2 Modified" },
			},
			{
				id: "c4",
				file_id: file.id,
				plugin_key: mockJsonPlugin.key,
				entity_id: "l3",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				snapshot_content: { value: "Value 3" },
			},
			{
				id: "c5", // Add another change/entity for complexity
				entity_id: "l4",
				file_id: "file1",
				schema_key: "mock_json_property",
				schema_version: "1.0",
				plugin_key: mockJsonPlugin.key,
				snapshot_content: { value: "Value 4" },
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [changes[0]!, changes[1]!, changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [changes[3]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs0],
	});

	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [changes[4]!, changes[5]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs1],
	});

	// Apply change sets in order: cs0, then cs1, then cs2
	// This demonstrates the explicit, predictable "direct" behavior
	await applyChangeSet({
		lix,
		changeSet: cs0,
	});

	const fileCs0Before = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The file data should now be a JSON string representing the state at cs0
	const expectedJsonStateCs0 = {
		l0: "Value 0",
		l1: "Value 1",
		l2: "Value 2",
	};

	const actualJsonStateCs0 = JSON.parse(
		new TextDecoder().decode(fileCs0Before.data)
	);

	expect(actualJsonStateCs0).toEqual(expectedJsonStateCs0);

	// Apply cs1 (which modifies l2 to "Value 2 Modified")
	await applyChangeSet({
		lix,
		changeSet: cs1,
	});

	// Apply cs2 (which adds l3 and l4)
	await applyChangeSet({
		lix,
		changeSet: cs2,
	});

	// Verify initial state
	const fileAfterRestoreCs2 = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The file data should now be a JSON string representing the state at cs2
	const expectedJsonStateCs2 = {
		l0: "Value 0",
		l1: "Value 1",
		l2: "Value 2 Modified", // c3 replaced c2
		l3: "Value 3", // c4 added
		l4: "Value 4", // c5 added
	};

	const actualJsonStateCs2 = JSON.parse(
		new TextDecoder().decode(fileAfterRestoreCs2.data)
	);

	expect(actualJsonStateCs2).toEqual(expectedJsonStateCs2);

	// Action: Create transition change set to restore to cs0
	const transitionChangeSet = await createTransitionChangeSet({
		lix,
		sourceChangeSet: cs2,
		targetChangeSet: cs0,
	});

	// Apply the transition change set
	await applyChangeSet({
		lix,
		changeSet: transitionChangeSet,
	});

	// Verify final state
	// 1. Check that versions change set parent is cs2
	const finalVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", activeVersion.id)
		.select(["change_set_id"])
		.executeTakeFirstOrThrow();

	const parentCs = await lix.db
		.selectFrom("change_set_edge")
		.where("child_id", "=", finalVersion.change_set_id)
		.select(["parent_id"])
		.executeTakeFirstOrThrow();

	expect(parentCs.parent_id).toBe(cs2.id);

	// 2. Check if data is updated
	const finalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The file data should now be a JSON string representing the state at cs0
	const actualJsonState = JSON.parse(new TextDecoder().decode(finalFile.data));

	expect(actualJsonState).toEqual(expectedJsonStateCs0);
});
