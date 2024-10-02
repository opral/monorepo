import { test, expect } from "vitest";
import { getLeafChangesOnlyInSource } from "./get-leaf-changes-only-in-source.js";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { NewChange } from "../database/schema.js";

test("it should get the leaf changes that only exist in source", async () => {
	const sourceLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const currentSourceBranch = await sourceLix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();
	const targetLix = await openLixInMemory({
		blob: await newLixFile(),
	});
	const currentTargetBranch = await targetLix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();
	const commonChanges: NewChange[] = [
		{
			id: "c1",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
		{
			id: "c2",
			file_id: "mock",
			parent_id: "c1",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
	];
	const changesOnlyInSource: NewChange[] = [
		{
			id: "s1",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
		{
			id: "s2",
			parent_id: "s1",
			file_id: "mock",
			operation: "update",
			plugin_key: "mock",
			type: "mock",
		},
		{
			id: "s3",
			parent_id: "s2",
			file_id: "mock",
			operation: "update",
			plugin_key: "mock",
			type: "mock",
		},
	];
	const changesOnlyInTarget: NewChange[] = [
		{
			id: "t1",
			parent_id: "c2",
			file_id: "mock",
			operation: "create",
			plugin_key: "mock",
			type: "mock",
		},
	];

	await targetLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInTarget])
		.execute();

	await targetLix.db
		.insertInto("branch_change")
		.values([
			{
				branch_id: currentTargetBranch.id,
				change_id: "c1",
				seq: 1,
			},
			{
				branch_id: currentTargetBranch.id,
				change_id: "c2",
				seq: 2,
			},
			{
				branch_id: currentTargetBranch.id,
				change_id: "t1",
				seq: 3,
			},
		])
		.execute();

	await sourceLix.db
		.insertInto("change")
		.values([...commonChanges, ...changesOnlyInSource])
		.execute();

	await sourceLix.db
		.insertInto("branch_change")
		.values([
			{
				branch_id: currentSourceBranch.id,
				change_id: "c1",
				seq: 1,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "c2",
				seq: 2,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "s1",
				seq: 3,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "s2",
				seq: 4,
			},
			{
				branch_id: currentSourceBranch.id,
				change_id: "s3",
				seq: 5,
			},
		])
		.execute();

	const result = await getLeafChangesOnlyInSource({
		sourceLix: sourceLix,
		targetLix: targetLix,
	});

	// only the last change in the source is expected,
	// not s1 and s2 which are parents of s3
	expect(result.map((c) => c.id)).toEqual(["s3"]);
});
