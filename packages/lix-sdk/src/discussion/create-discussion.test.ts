import { expect, test } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { LixPlugin } from "../plugin.js";
import { createDiscussion } from "./create-discussion.js";
import { createChangeSet } from "../change-set/create-change-set.js";

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

	await createDiscussion({
		lix,
		changeSet: await createChangeSet({ lix, changes }),
		content: "comment on a change",
	});

	const discussions = await lix.db
		.selectFrom("change_set_discussion")
		.selectAll()
		.execute();

	expect(discussions).toHaveLength(1);

	const comments = await lix.db
		.selectFrom("comment")
		.selectAll()
		.where("discussion_id", "=", discussions[0]!.discussion_id)
		.execute();

	expect(comments).toHaveLength(1);
});
