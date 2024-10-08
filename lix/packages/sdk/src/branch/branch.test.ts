import { expect, test } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import type { LixPlugin } from "../plugin.js";
import { newLixFile } from "../newLix.js";

test("should use branches correctly", async () => {
	const mockPlugin: LixPlugin<{
		text: { id: string; text: string };
	}> = {
		key: "mock-plugin",
		glob: "*",
		applyChanges: async ({ file, lix, changes }) => {
			const enc = new TextEncoder();
			if (changes.length > 1) {
				throw new Error("cannot apply more than one change per text file");
			}

			// console.log(JSON.stringify({ changes }, null, 4));

			return {
				fileData: enc.encode(changes[0]?.value!.text),
			};
		},
		diff: {
			file: async ({ old, neu }) => {
				const dec = new TextDecoder();
				// console.log("diff", neu, old?.data, neu?.data);
				const newText = dec.decode(neu?.data);
				const oldText = dec.decode(old?.data);

				if (newText === oldText) {
					return [];
				}

				return await mockPlugin.diff.text({
					old: old
						? {
								id: "test",
								text: oldText,
							}
						: undefined,
					neu: neu
						? {
								id: "test",
								text: newText,
							}
						: undefined,
				});
			},
			text: async ({ old, neu }) => {
				if (old?.text === neu?.text) {
					return [];
				}

				return [
					!old
						? {
								type: "text",
								operation: "create",
								old: undefined,
								neu: {
									id: "test",
									text: neu?.text,
								},
							}
						: {
								type: "text",
								operation: "update",
								old: {
									id: "test",
									text: old?.text,
								},
								neu: {
									id: "test",
									text: neu?.text,
								},
							},
				];
			},
		},
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const branches = await lix.db.selectFrom("branch").selectAll().execute();

	expect(branches).toEqual([
		{
			id: branches[0]?.id,
			name: "main",
			base_branch: null,
			active: 1,
		},
	]);

	await lix.createBranch({ branchId: "test_branch", name: "test_branch" });

	const branches2 = await lix.db.selectFrom("branch").selectAll().execute();

	expect(branches2).toEqual([
		{
			id: branches[0]?.id,
			name: "main",
			base_branch: null,
			active: 1,
		},
		{
			active: 0,
			base_branch: branches[0]?.id,
			id: branches2[1]!.id,
			name: "test_branch",
		},
	]);

	const enc = new TextEncoder();

	await lix.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: enc.encode("test orig") })
		.execute();

	await lix.settled();

	expect(
		(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	).toBe(0);

	const changes = await lix.db.selectFrom("change").selectAll().execute();

	expect(changes).toEqual([
		{
			id: changes[0]?.id,
			author: null,
			created_at: changes[0]?.created_at,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "test orig",
			},
			meta: null,
			operation: "create",
		},
	]);

	const branchChanges = await lix.db
		.selectFrom("branch_change")
		.selectAll()
		.execute();

	expect(branchChanges).toEqual([
		{
			branch_id: branches[0]?.id,
			change_id: changes[0]?.id,
			id: branchChanges[0]?.id,
			seq: 1,
		},
	]);

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute();

	// repeat same update
	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute();

	// re apply same change
	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute();

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text second update") })
		.where("id", "=", "test")
		.execute();

	await lix.settled();

	await lix.createBranch({ name: "test_branch_2", branchId: "test_branch_2" });

	const branches3 = await lix.db
		.selectFrom("branch")
		.orderBy("name")
		.selectAll()
		.execute();

	expect(branches3).toEqual([
		{
			id: branches[0]?.id,
			name: "main",
			base_branch: null,
			active: 1,
		},
		{
			active: 0,
			base_branch: branches[0]?.id,
			id: branches3[1]!.id,
			name: "test_branch",
		},
		{
			active: 0,
			base_branch: branches[0]?.id,
			id: branches3[2]!.id,
			name: "test_branch_2",
		},
	]);

	const updatedChanges = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	expect(updatedChanges).toEqual([
		{
			id: changes[0]?.id,
			author: null,
			created_at: changes[0]?.created_at,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "test orig",
			},
			meta: null,
			operation: "create",
		},
		{
			author: null,
			id: updatedChanges[1]?.id,
			created_at: updatedChanges[1]?.created_at,
			parent_id: changes[0]?.id,
			type: "text",
			file_id: "test",
			operation: "update",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "test updated text",
			},
			meta: null,
		},
		{
			id: updatedChanges[2]?.id,
			author: null,
			parent_id: updatedChanges[1]?.id,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			operation: "update",
			value: { id: "test", text: "test updated text second update" },
			meta: null,
			created_at: updatedChanges[2]?.created_at,
		},
	]);

	const branchChanges2 = await lix.db
		.selectFrom("branch_change")
		.orderBy(["branch_id", "seq"])
		.selectAll()
		.execute();

	expect(branchChanges2).toEqual([
		{
			branch_id: branches[0]?.id,
			change_id: updatedChanges[0]?.id,
			id: branchChanges2[0]?.id,
			seq: 1,
		},
		{
			branch_id: branches[0]?.id,
			change_id: updatedChanges[1]?.id,
			id: branchChanges2[1]?.id,
			seq: 2,
		},
		{
			branch_id: branches[0]?.id,
			change_id: updatedChanges[2]?.id,
			id: branchChanges2[2]?.id,
			seq: 3,
		},

		{
			branch_id: branches3[2]?.id,
			change_id: updatedChanges[0]?.id,
			id: branchChanges2[0]?.id,
			seq: 1,
		},
		{
			branch_id: branches3[2]?.id,
			change_id: updatedChanges[1]?.id,
			id: branchChanges2[1]?.id,
			seq: 2,
		},
		{
			branch_id: branches3[2]?.id,
			change_id: updatedChanges[2]?.id,
			id: branchChanges2[2]?.id,
			seq: 3,
		},
	]);

	// test change_view
	const changesFromView = await lix.db
		.selectFrom("change_view")
		.where("branch_id", "=", branches[0]!.id)
		.selectAll()
		.execute();

	expect(changesFromView).toEqual([
		{
			author: null,
			id: changesFromView[0]?.id,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			operation: "create",
			value: { id: "test", text: "test orig" },
			meta: null,
			created_at: changesFromView[0]?.created_at,
			branch_id: branches[0]?.id,
			seq: 1,
		},
		{
			author: null,
			id: changesFromView[1]?.id,
			file_id: "test",
			parent_id: changesFromView[0]?.id,
			type: "text",
			plugin_key: "mock-plugin",
			operation: "update",
			value: { id: "test", text: "test updated text" },
			meta: null,
			created_at: changesFromView[1]?.created_at,
			branch_id: branches[0]?.id,
			seq: 2,
		},
		{
			author: null,
			id: changesFromView[2]?.id,
			parent_id: changesFromView[1]?.id,
			file_id: "test",
			type: "text",
			plugin_key: "mock-plugin",
			operation: "update",
			value: { id: "test", text: "test updated text second update" },
			meta: null,
			created_at: changesFromView[2]?.created_at,
			branch_id: branches[0]?.id,
			seq: 3,
		},
	]);

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text  xyz") })
		.where("id", "=", "test")
		.execute();

	await lix.settled();

	const branchChanges3 = await lix.db
		.selectFrom("branch_change")
		.orderBy(["branch_id", "seq"])
		.selectAll()
		.execute();

	expect(branchChanges3).toEqual([
		{
			branch_id: branches[0]?.id,
			change_id: updatedChanges[0]?.id,
			id: branchChanges2[0]?.id,
			seq: 1,
		},
		{
			branch_id: branches[0]?.id,
			change_id: updatedChanges[1]?.id,
			id: branchChanges2[1]?.id,
			seq: 2,
		},
		{
			branch_id: branches[0]?.id,
			change_id: updatedChanges[2]?.id,
			id: branchChanges2[2]?.id,
			seq: 3,
		},

		{
			branch_id: branches[0]?.id,
			change_id: branchChanges3[3]?.change_id,
			id: branchChanges3[3]?.id,
			seq: 4,
		},

		{
			branch_id: branches3[2]?.id,
			change_id: updatedChanges[0]?.id,
			id: branchChanges2[0]?.id,
			seq: 1,
		},
		{
			branch_id: branches3[2]?.id,
			change_id: updatedChanges[1]?.id,
			id: branchChanges2[1]?.id,
			seq: 2,
		},
		{
			branch_id: branches3[2]?.id,
			change_id: updatedChanges[2]?.id,
			id: branchChanges2[2]?.id,
			seq: 3,
		},
	]);

	const newBranch = await lix.db
		.selectFrom("branch")
		.where("name", "=", "test_branch_2")
		.select("id")
		.executeTakeFirstOrThrow();

	await lix.switchBranch({ branchId: newBranch.id });

	await lix.settled();

	const afterSwitchBranch = await lix.db
		.selectFrom("branch")
		.selectAll()
		.where("active", "=", true)
		.executeTakeFirstOrThrow();

	const afterSwitchContent = await lix.db
		.selectFrom("file")
		.selectAll()
		.where("path", "=", "test.txt")
		.executeTakeFirstOrThrow();

	expect(afterSwitchBranch.name).toEqual("test_branch_2");

	const dec = new TextDecoder();

	expect(dec.decode(afterSwitchContent.data)).toEqual(
		"test updated text second update",
	);
});
