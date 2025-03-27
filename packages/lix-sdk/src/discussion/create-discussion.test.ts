import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createDiscussion } from "./create-discussion.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test("should be able to start a discussion on changes", async () => {
	const lix = await openLixInMemory({});

	// produce a change
	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock_key",
			value: "mock_value",
		})
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.selectAll("change")
		.execute();

	let changeSetId: string;

	await lix.db.transaction().execute(async (trx) => {
		const changeSet = await createChangeSet({ lix: { db: trx }, changes });
		changeSetId = changeSet.id;
		await createDiscussion({
			lix: { db: trx },
			firstComment: { content: "Hello, world!" },
			changeSet,
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

	// Verify the change set has been updated with the discussion ID
	const changeSet = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.where("id", "=", changeSetId!)
		.executeTakeFirst();
	
	expect(changeSet?.discussion_id).toBe(discussions[0]!.id);
});

test("should be able to create a standalone discussion (not tied to a change set)", async () => {
	const lix = await openLixInMemory({});

	await lix.db.transaction().execute(async (trx) => {
		await createDiscussion({
			lix: { db: trx },
			firstComment: { content: "This is a standalone discussion" },
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
	expect(comments[0]!.content).toBe("This is a standalone discussion");
});
