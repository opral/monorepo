import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { newLixFile } from "../lix/new-lix.js";
import type { DetectedChange, LixPlugin } from "../plugin/lix-plugin.js";
import { createDiscussion } from "./create-discussion.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeQueueSettled } from "../change-queue/change-queue-settled.js";

const mockPlugin: LixPlugin = {
	key: "mock-plugin",
	detectChangesGlob: "*",
	detectChanges: async ({ after }) => {
		return [
			{
				schema: {
					key: "text",
					type: "json",
				},
				entity_id: "test",
				snapshot: {
					text: after ? new TextDecoder().decode(after.data) : undefined,
				},
			} satisfies DetectedChange,
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

	await changeQueueSettled({ lix });

	const changes = await lix.db
		.selectFrom("change")
		.selectAll("change")
		.execute();

	await lix.db.transaction().execute(async (trx) => {
		await createDiscussion({
			lix: { db: trx },
			changeSet: await createChangeSet({ lix: { db: trx }, changes }),
			content: "comment on a change",
		});
	});

	const discussions = await lix.db
		.selectFrom("discussion")
		.selectAll()
		.execute();

	expect(discussions).toHaveLength(1);

	const comments = await lix.db
		.selectFrom("comment")
		.selectAll()
		.where("discussion_id", "=", discussions[0]!.id)
		.execute();

	expect(comments).toHaveLength(1);
});
