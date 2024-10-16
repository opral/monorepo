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
			file: async ({ before, after }) => {
				const textBefore = before
					? new TextDecoder().decode(before?.data)
					: undefined;
				const textAfter = after
					? new TextDecoder().decode(after.data)
					: undefined;

				if (textBefore === textAfter) {
					return [];
				}
				return [
					{
						type: "text",
						entity_id: "test",
						before: textBefore ? { text: textBefore } : undefined,
						after: textAfter ? { text: textAfter } : undefined,
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
		.values({ id: "test", path: "test.txt", data: enc.encode("value1") })
		.execute();

	await lix.settled();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot as snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.value")
		.execute();

	expect(changes).toEqual([
		expect.objectContaining({
			parent_id: null,
			value: {
				text: "value1",
			},
		}),
	]);

	await lix.commit({ description: "first commit" });

	const secondRef = await lix.db
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();

	expect(secondRef.commit_id).not.toBe("00000000-0000-0000-0000-000000000000");

	const commits = await lix.db.selectFrom("commit").selectAll().execute();
	const commitedChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.value")
		.execute();

	expect(commitedChanges).toEqual([
		expect.objectContaining({
			...changes[0],
			commit_id: commits[0]?.id!,
		}),
	]);

	expect(commits).toEqual([
		{
			id: commits[0]?.id!,
			author: null,
			created: commits[0]?.created!,
			created_at: commits[0]?.created_at!,
			description: "first commit",
			parent_id: "00000000-0000-0000-0000-000000000000",
		},
	]);

	await lix.db
		.updateTable("file")
		.set({ data: enc.encode("value2") })
		.where("id", "=", "test")
		.execute();

	await lix.settled();

	const changesAfter = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.value")
		.execute();

	expect(changesAfter).toEqual([
		expect.objectContaining({
			parent_id: null,
			value: {
				text: "value1",
			},
			commit_id: commits[0]?.id,
		}),
		expect.objectContaining({
			parent_id: changesAfter[0]?.id!,
			value: {
				text: "value2",
			},
			commit_id: null,
		}),
	]);

	await lix.commit({ description: "second commit" });
	const newCommits = await lix.db.selectFrom("commit").selectAll().execute();
	expect(newCommits).toEqual([
		{
			id: newCommits[0]?.id!,
			author: null,
			created: commits[0]?.created!,
			created_at: newCommits[0]?.created_at!,
			description: "first commit",
			parent_id: "00000000-0000-0000-0000-000000000000",
		},
		{
			id: newCommits[1]?.id!,
			author: null,
			created: commits[0]?.created!,
			created_at: newCommits[1]?.created_at!,
			description: "second commit",
			parent_id: newCommits[0]?.id!,
		},
	]);
});
