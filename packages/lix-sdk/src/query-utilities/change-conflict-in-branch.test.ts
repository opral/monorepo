import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { changeConflictInBranch } from "./change-conflict-in-branch.js";

test("should find conflicts in the given branch", async () => {
	const lix = await openLixInMemory({});

	// Insert changes
	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				type: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				type: "mock",
				file_id: "mock",
				entity_id: "value1",
				snapshot_id: "no-content",
			},
		])
		.execute();

	const branch0 = await lix.db
		.insertInto("branch")
		.values({
			id: "branch0",
			name: "Test Branch",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const branch1 = await lix.db
		.insertInto("branch")
		.values({
			id: "branch1",
			name: "Test Branch",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create change conflicts
	const mockConflict0 = await createChangeConflict({
		lix,
		branch: branch0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// conflict in another branch that should not be found
	await createChangeConflict({
		lix,
		branch: branch1,
		key: "mock-conflict1",
		conflictingChangeIds: new Set(["change0"]),
	});

	// Insert branch change conflict pointers (only for mockConflict0)
	await lix.db
		.insertInto("branch_change_conflict_pointer")
		.values([{ branch_id: branch0.id, change_conflict_id: mockConflict0.id }])
		.execute();

	// Query conflicts in the branch
	const conflictsInBranch = await lix.db
		.selectFrom("change_conflict")
		.where(changeConflictInBranch(branch0))
		.selectAll()
		.execute();

	expect(conflictsInBranch.length).toBe(1);
	expect(conflictsInBranch[0]?.id).toBe(mockConflict0.id);
});
