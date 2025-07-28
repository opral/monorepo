import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createCommit } from "../commit/create-commit.js";
import { changeSetElementInAncestryOf } from "./change-set-element-in-ancestry-of.js";

test("returns all elements from a single change set and its ancestors", async () => {
	const lix = await openLix({});

	// Insert required schema entry in global version
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "mock",
			version: "1",
			value: {
				"x-lix-key": "mock",
				"x-lix-version": "1",
				additionalProperties: false,
				properties: {},
				type: "object",
			},
			lixcol_version_id: "global",
		})
		.execute();

	// Insert mock change (reused across sets)
	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "c0",
			entity_id: "e1",
			file_id: "f1",
			plugin_key: "mock",
			schema_version: "1",
			schema_key: "mock",
			snapshot_content: { hello: "world" },
		})
		.returningAll()
		.execute();

	// cs0 <- cs1 <- cs2 (with corresponding commits)
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
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit1 = await createCommit({
		lix,
		changeSet: cs1,
		parentCommits: [commit0],
	});

	const cs2 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
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

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf(commit2))
		.select("change_set_id")
		.execute();

	expect(elements.map((e) => e.change_set_id).sort()).toEqual(
		[cs0.id, cs1.id, cs2.id].sort()
	);
});

test("respects depth limit when provided for a single target", async () => {
	const lix = await openLix({});

	// Insert required schema entry in global version
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "mock",
			version: "1",
			value: {
				"x-lix-key": "mock",
				"x-lix-version": "1",
				additionalProperties: false,
				properties: {},
				type: "object",
			},
			lixcol_version_id: "global",
		})
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "c1",
			entity_id: "e1",
			file_id: "f1",
			schema_version: "1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_content: { val: "hi" },
		})
		.returningAll()
		.execute();

	// cs0 <- cs1 <- cs2 (with corresponding commits)
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
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit1 = await createCommit({
		lix,
		changeSet: cs1,
		parentCommits: [commit0],
	});

	const cs2 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
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

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf(commit2, { depth: 1 }))
		.select("change_set_id")
		.execute();

	expect(elements.map((e) => e.change_set_id).sort()).toEqual(
		[cs1.id, cs2.id].sort()
	);
});

test("returns combined elements from multiple divergent change set ancestries", async () => {
	const lix = await openLix({});

	// Insert required schema entry in global version
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "mock",
			version: "1",
			value: {
				"x-lix-key": "mock",
				"x-lix-version": "1",
				additionalProperties: false,
				properties: {},
				type: "object",
			},
			lixcol_version_id: "global",
		})
		.execute();

	// Shared change
	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "c1",
			entity_id: "e1",
			file_id: "f1",
			schema_version: "1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_content: { val: "shared" },
		})
		.returningAll()
		.execute();

	// cs0 <- cs1 <- cs2
	//    \
	//     <- cs3 <- cs4
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
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit1 = await createCommit({
		lix,
		changeSet: cs1,
		parentCommits: [commit0],
	});

	const cs2 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	}); // Branch 1 leaf
	const commit2 = await createCommit({
		lix,
		changeSet: cs2,
		parentCommits: [commit1],
	});

	const cs3 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit3 = await createCommit({
		lix,
		changeSet: cs3,
		parentCommits: [commit0],
	});

	const cs4 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	}); // Branch 2 leaf
	const commit4 = await createCommit({
		lix,
		changeSet: cs4,
		parentCommits: [commit3],
	});

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([commit2, commit4])) // Target both leaves
		.select("change_set_id")
		.distinct()
		.execute();

	// Expect all change sets from both branches, including common ancestor cs0
	expect(elements.map((e) => e.change_set_id).sort()).toEqual(
		[cs0.id, cs1.id, cs2.id, cs3.id, cs4.id].sort()
	);
});

test("respects depth limit with multiple divergent targets", async () => {
	const lix = await openLix({});

	// Insert required schema entry in global version
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "mock",
			version: "1",
			value: {
				"x-lix-key": "mock",
				"x-lix-version": "1",
				additionalProperties: false,
				properties: {},
				type: "object",
			},
			lixcol_version_id: "global",
		})
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values({
			id: "c1",
			entity_id: "e1",
			file_id: "f1",
			schema_version: "1",
			plugin_key: "mock",
			schema_key: "mock",
			snapshot_content: { val: "shared" },
		})
		.returningAll()
		.execute();

	// cs0 <- cs1 <- cs2
	//    \
	//     <- cs3 <- cs4
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
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit1 = await createCommit({
		lix,
		changeSet: cs1,
		parentCommits: [commit0],
	});

	const cs2 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	}); // Branch 1 leaf
	const commit2 = await createCommit({
		lix,
		changeSet: cs2,
		parentCommits: [commit1],
	});

	const cs3 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	});
	const commit3 = await createCommit({
		lix,
		changeSet: cs3,
		parentCommits: [commit0],
	});

	const cs4 = await createChangeSet({
		lix,
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		lixcol_version_id: "global",
	}); // Branch 2 leaf
	const commit4 = await createCommit({
		lix,
		changeSet: cs4,
		parentCommits: [commit3],
	});

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where(changeSetElementInAncestryOf([commit2, commit4], { depth: 1 })) // Depth 1 from targets
		.select("change_set_id")
		.distinct()
		.execute();

	// Expect targets and their direct parents (cs1, cs3)
	expect(elements.map((e) => e.change_set_id).sort()).toEqual(
		[cs1.id, cs2.id, cs3.id, cs4.id].sort()
	);
});
