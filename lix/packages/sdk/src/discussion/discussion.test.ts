/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, expectTypeOf, test } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { LixPlugin } from "../plugin.js";

const mockPlugin: LixPlugin = {
	key: "mock-plugin",
	glob: "*",
	diff: {
		file: async ({ old, neu }) => {
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

test("should be able to start a discussion on changes", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	lix.currentAuthor.set("Test User");

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
			author: "Test User",
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

	const discussion = await lix.createDiscussion({
		changeIds: [changes[0]!.id],
		body: "comment on a change",
	});

	expect(discussion.id).toBeTypeOf("string");

	const discussions = await lix.db
		.selectFrom("discussion")
		.selectAll()
		.execute();

	expect(Array.isArray(discussions)).toBe(true);

	expect(discussions).toHaveLength(1);

	expect(discussions[0]).toHaveProperty("id");

	const commentsAfterOneComment = await lix.db
		.selectFrom("comment")
		.selectAll()
		.where("discussion_id", "=", discussions[0]!.id)
		.execute();

	expect(commentsAfterOneComment).toHaveLength(1);

	const commentOnAComment = await lix.addComment({
		parentCommentId: commentsAfterOneComment[0]!.id,
		body: "comment on a comment on a change",
	});

	const commentsAfterCommentingAComment = await lix.db
		.selectFrom("comment")
		.selectAll()
		.where("discussion_id", "=", discussions[0]!.id)
		.execute();
	expect(commentsAfterCommentingAComment).toHaveLength(2);
});

test("should fail to create a disussion on non existing changes", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	lix.currentAuthor.set("Test User");

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
			author: "Test User",
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

	let err;
	await lix
		.createDiscussion({
			changeIds: [
				
					"I DON’T EXIST",
				
			],
			body: "comment on a change",
		})
		.catch((e) => (err = e));

	// TODO check for error
	// .toThrowError ... https://vitest.dev/api/expect.html#tothrowerror
});
