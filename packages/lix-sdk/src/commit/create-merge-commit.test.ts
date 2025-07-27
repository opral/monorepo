import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createMergeCommit } from "./create-merge-commit.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createCommit } from "./create-commit.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

test("it should merge non-conflicting changes", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "test_schema",
			version: "1.0",
			value: {
				"x-lix-key": "test_schema",
				"x-lix-version": "1.0",
				type: "object",
				additionalProperties: false,
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			} satisfies LixSchemaDefinition,
			lixcol_version_id: "global",
		})
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c0",
				schema_key: "test_schema",
				schema_version: "1.0",
				entity_id: "e0",
				file_id: "file0",
				plugin_key: "mock_plugin",
				snapshot_content: null,
			},
			{
				id: "c1",
				schema_key: "test_schema",
				schema_version: "1.0",
				entity_id: "e1",
				file_id: "file0",
				plugin_key: "mock_plugin",
				snapshot_content: null,
			},
			{
				id: "c2",
				schema_key: "test_schema",
				schema_version: "1.0",
				entity_id: "e2",
				file_id: "file0",
				plugin_key: "mock_plugin",
				snapshot_content: null,
			},
		])
		.returningAll()
		.execute();

	const cs0 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit0 = await createCommit({ lix, changeSet: cs0 });

	const cs1 = await createChangeSet({
		lix,
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit1 = await createCommit({ lix, changeSet: cs1 });

	// simulating graph relation
	const cs2 = await createChangeSet({
		lix,
		elements: [changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit2 = await createCommit({
		lix,
		changeSet: cs2,
		parentCommits: [commit1],
	});

	const merged = await createMergeCommit({
		lix,
		source: commit0,
		target: commit2,
	});

	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", merged.change_set_id)
		.selectAll()
		.execute();

	expect(mergedElements).toHaveLength(3);
	expect(mergedElements.map((e) => e.change_id).sort()).toEqual(
		[changes[0]!.id, changes[1]!.id, changes[2]!.id].sort()
	);
});

test("should handle conflicting elements with source winning (until conflicts are modeled in lix)", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "s1",
			version: "1.0",
			value: {
				"x-lix-key": "s1",
				"x-lix-version": "1.0",
				additionalProperties: false,
				type: "object",
				properties: {
					id: { type: "string" },
					text: { type: "string" },
				},
				required: ["id"],
			} satisfies LixSchemaDefinition,
			lixcol_version_id: "global",
		})
		.execute();

	// Create changes for the different states of the same entity
	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "c_base",
				schema_key: "s1",
				schema_version: "1.0",
				entity_id: "e1",
				file_id: "file1",
				plugin_key: "mock_plugin",
				snapshot_content: { text: "base" },
			},
			{
				id: "c_target",
				schema_key: "s1",
				schema_version: "1.0",
				entity_id: "e1", // Same entity as base, different content
				file_id: "file1",
				plugin_key: "mock_plugin",
				snapshot_content: { text: "target mod" },
			},
			{
				id: "c_source",
				schema_key: "s1",
				schema_version: "1.0",
				entity_id: "e1", // Same entity as base, different content
				file_id: "file1",
				plugin_key: "mock_plugin",
				snapshot_content: { text: "source mod" },
			},
		])
		.returningAll()
		.execute();

	// 1. Base change set with initial content
	const cs_base = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit_base = await createCommit({
		lix,
		changeSet: cs_base,
	});

	// 2. Target branch - modifies e1
	const cs_target = await createChangeSet({
		lix,
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit_target = await createCommit({
		lix,
		changeSet: cs_target,
		parentCommits: [commit_base],
	});

	// 3. Source branch - modifies e1 differently
	const cs_source = await createChangeSet({
		lix,
		elements: [changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit_source = await createCommit({
		lix,
		changeSet: cs_source,
		parentCommits: [commit_base],
	});

	// 4. Merge source into target
	const merged = await createMergeCommit({
		lix,
		source: commit_source,
		target: commit_target,
	});

	// 5. Verify merged change set elements
	const mergedElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_element.change_set_id", "=", merged.change_set_id)
		.selectAll()
		.execute();

	// The merge should only contain the element from the source change set due to "source wins"
	expect(mergedElements).toHaveLength(1);
	expect(mergedElements[0]).toEqual(
		expect.objectContaining({
			change_set_id: merged.change_set_id,
			change_id: changes[2]!.id,
			entity_id: changes[2]!.entity_id,
			schema_key: changes[2]!.schema_key,
			file_id: changes[2]!.file_id,
		})
	);

	// 6. Verify graph structure - the merged commit should have edges pointing to both source and target
	const edges = await lix.db
		.selectFrom("commit_edge")
		.where("child_id", "=", merged.id)
		.selectAll()
		.execute();

	expect(edges).toHaveLength(2);
	expect(edges.map((e) => e.parent_id).sort()).toEqual(
		[commit_source.id, commit_target.id].sort()
	);
});
