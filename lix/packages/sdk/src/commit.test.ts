/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest";
import { openLixInMemory } from "./open/openLixInMemory.js";
import { newLixFile } from "./newLix.js";
import type { LixPlugin } from "./plugin.js";

test("should be able to add and commit changes", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: async ({ old }) => {
				return [
					!old
						? {
								type: "text",
								operation: "create",
								old: undefined,
								neu: {
									id: "test",
									text: "inserted text",
								},
							}
						: {
								type: "text",
								operation: "update",
								old: {
									id: "test",
									text: "inserted text",
								},
								neu: {
									id: "test",
									text: "updated text",
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

	const firstRef = await lix.db
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();
	expect(firstRef.commit_id).toBe("00000000-0000-0000-0000-000000000000");

	const enc = new TextEncoder();

	await lix.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: enc.encode("test") })
		.execute();

	await lix.settled();

	const changes = await lix.db.selectFrom("change").selectAll().execute();

	// console.log(await lix.db.selectFrom("queue").selectAll().execute());

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
				text: "inserted text",
			},
			meta: null,
			commit_id: null,
			operation: "create",
		},
	]);

	await lix.commit({ description: "test" });

	const secondRef = await lix.db
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();

	expect(secondRef.commit_id).not.toBe("00000000-0000-0000-0000-000000000000");

	const commits = await lix.db.selectFrom("commit").selectAll().execute();
	const commitedChanges = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	expect(commitedChanges).toEqual([
		{
			id: commitedChanges[0]?.id,
			author: null,
			created_at: changes[0]?.created_at,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "inserted text",
			},
			meta: null,
			commit_id: commits[0]?.id!,
			operation: "create",
		},
	]);

	expect(commits).toEqual([
		{
			id: commits[0]?.id!,
			author: null,
			created: commits[0]?.created!,
			created_at: commits[0]?.created_at!,
			description: "test",
			parent_id: "00000000-0000-0000-0000-000000000000",
		},
	]);

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute();

	await lix.settled();

	const updatedChanges = await lix.db
		.selectFrom("change")
		.selectAll()
		.execute();

	expect(updatedChanges).toEqual([
		{
			id: updatedChanges[0]?.id!,
			author: null,
			created_at: updatedChanges[0]?.created_at,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "inserted text",
			},
			meta: null,
			commit_id: commits[0]?.id,
			operation: "create",
		},
		{
			id: updatedChanges[1]?.id!,
			author: null,
			parent_id: updatedChanges[0]?.id!,
			created_at: updatedChanges[0]?.created_at,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "updated text",
			},
			meta: null,
			commit_id: null,
			operation: "update",
		},
	]);

	await lix.commit({ description: "test 2" });
	const newCommits = await lix.db.selectFrom("commit").selectAll().execute();
	expect(newCommits).toEqual([
		{
			id: newCommits[0]?.id!,
			author: null,
			created: commits[0]?.created!,
			created_at: newCommits[0]?.created_at!,
			description: "test",
			parent_id: "00000000-0000-0000-0000-000000000000",
		},
		{
			id: newCommits[1]?.id!,
			author: null,
			created: commits[0]?.created!,
			created_at: newCommits[1]?.created_at!,
			description: "test 2",
			parent_id: newCommits[0]?.id!,
		},
	]);
});
