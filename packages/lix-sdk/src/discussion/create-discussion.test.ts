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

	await lix.db.transaction().execute(async (trx) => {
		await createDiscussion({
			lix: { ...lix, db: trx },
			firstComment: { content: "Hello, world!" },
			changeSet: await createChangeSet({ lix: { ...lix, db: trx }, changes }),
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
