import { expect, test } from "vitest"
import { openLixInMemory } from "./open/openLixInMemory.js"
import { newLixFile } from "./newLix.js"
import type { LixPlugin } from "./plugin.js"

test("should be able to add and commit changes", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {
			file: async ({ old, neu }) => {
				return [
					!old
						? {
								type: "text",
								operation: "insert",
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
				]
			},
		},
	}
	const lix = await openLixInMemory({ blob: await newLixFile(), providePlugins: [mockPlugin] })

	const firstRef = await lix.db
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow()
	expect(firstRef.commit_id).toBe("0000-000000-0000")

	var enc = new TextEncoder()

	await lix.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: enc.encode("test") })
		.execute()

	const changes = await lix.db.selectFrom("change").selectAll().execute()

	expect(changes).toEqual([
		{
			id: changes[0].id,
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
			conflict: null,
		},
	])

	await lix.commit({ userId: "tester", description: "test" })

	const secondRef = await lix.db
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow()

	expect(secondRef.commit_id).not.toBe("0000-000000-0000")

	const commits = await lix.db.selectFrom("commit").selectAll().execute()
	const commitedChanges = await lix.db.selectFrom("change").selectAll().execute()

	expect(commitedChanges).toEqual([
		{
			id: commitedChanges[0].id,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "inserted text",
			},
			meta: null,
			commit_id: commits[0].id,
			conflict: null,
		},
	])

	expect(commits).toEqual([
		{
			id: commits[0].id,
			created: commits[0].created,
			description: "test",
			parent_id: "0000-000000-0000",
			user_id: "tester",
		},
	])

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("test updated text") })
		.where("id", "=", "test")
		.execute()

	// TODO: replace with settled()
	await new Promise((resolve) => setTimeout(resolve, 100))

	const updatedChanges = await lix.db.selectFrom("change").selectAll().execute()

	expect(updatedChanges).toEqual([
		{
			id: updatedChanges[0].id,
			parent_id: null,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "inserted text",
			},
			meta: null,
			commit_id: commits[0].id,
			conflict: null,
		},
		{
			id: updatedChanges[1].id,
			parent_id: updatedChanges[0].id,
			type: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			value: {
				id: "test",
				text: "updated text",
			},
			meta: null,
			commit_id: null,
			conflict: null,
		},
	])

	await lix.commit({ userId: "tester", description: "test 2" })
	const newCommits = await lix.db.selectFrom("commit").selectAll().execute()
	expect(newCommits).toEqual([
		{
			id: newCommits[0].id,
			created: newCommits[0].created,
			description: "test",
			parent_id: "0000-000000-0000",
			user_id: "tester",
		},
		{
			id: newCommits[1].id,
			created: newCommits[1].created,
			description: "test 2",
			parent_id: newCommits[0].id,
			user_id: "tester",
		},
	])
})
