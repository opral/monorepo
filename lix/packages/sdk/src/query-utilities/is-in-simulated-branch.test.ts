/* eslint-disable unicorn/no-null */
import { test, expect } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import { isInSimulatedCurrentBranch } from "./is-in-simulated-branch.js";

test("as long as a conflict is unresolved, the conflicting change should not appear in the current branch", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn0',
			},
			{
				id: "change1",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn2',
			},
			{
				id: "change2",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn2',
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("conflict")
		.values([
			{
				change_id: "change0",
				conflicting_change_id: "change2",
				resolved_with_change_id: null,
			},
		])
		.returningAll()
		.execute();

	const changesInCurrentBranch = await lix.db
		.selectFrom("change")
		.selectAll()
		.where(isInSimulatedCurrentBranch)
		.execute();

	expect(changesInCurrentBranch.map((c) => c.id)).toEqual([
		changes[0]?.id,
		changes[1]?.id,
	]);
});

test(`if the conflict has been resolved by selecting the 'original' change, 
	the 'conflicting' change should not be in the current branch`, async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn0',
			},
			{
				id: "change1",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn1',
			},
			{
				id: "change2",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn2',
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("conflict")
		.values([
			{
				change_id: "change0",
				conflicting_change_id: "change2",
				resolved_with_change_id: "change0",
			},
		])
		.returningAll()
		.execute();

	const changesInCurrentBranch = await lix.db
		.selectFrom("change")
		.selectAll()
		.where(isInSimulatedCurrentBranch)
		.execute();

	expect(changesInCurrentBranch.map((c) => c.id)).toEqual([
		changes[0]?.id,
		changes[1]?.id,
	]);
});

test(`
	if the conflict has been resolved by selecting the conflicting change, 
	and rejecting the original change, the conflicting change should appear 
	in the branch while the original change is excluded`, async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn0',
			},
			{
				id: "change1",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn1',
			},
			{
				id: "change2",
				file_id: "mock",
				operation: "create",
				plugin_key: "mock",
				type: "mock",
				snapshot_id: 'sn2',
			},
		])
		.returningAll()
		.execute();

	await lix.db
		.insertInto("conflict")
		.values([
			{
				change_id: "change0",
				conflicting_change_id: "change2",
				resolved_with_change_id: "change2",
			},
		])
		.returningAll()
		.execute();

	const changesInCurrentBranch = await lix.db
		.selectFrom("change")
		.selectAll()
		.where(isInSimulatedCurrentBranch)
		.execute();

	expect(changesInCurrentBranch.map((c) => c.id)).toEqual([
		changes[1]?.id,
		changes[2]?.id,
	]);
});
