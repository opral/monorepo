import { expect, test } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { LixPlugin } from "../plugin.js";

const mockPlugin: LixPlugin = {
	key: "mock-plugin",
	glob: "*",
	detectChanges: async ({ after }) => {
		return [
			{
				type: "text",
				entity_id: "test",
				snapshot: {
					text: after ? new TextDecoder().decode(after.data) : undefined,
				},
			},
		];
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

	const changes = await lix.db
		.selectFrom("change")
		.selectAll("change")
		.execute();

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

	await lix.addComment({
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

	await lix.createDiscussion({
		changeIds: ["I DON'T EXIST"],
		body: "comment on a change",
	});

	// TODO check for error
	// .toThrowError ... https://vitest.dev/api/expect.html#tothrowerror
});
