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
		const changeSet = await createChangeSet({
			lix: { ...lix, db: trx },
			elements: [
				{
					change_id: changes[0]!.id,
					entity_id: changes[0]!.entity_id,
					schema_key: changes[0]!.schema_key,
					file_id: changes[0]!.file_id,
				},
			],
		});

		await createDiscussion({
			lix: { ...lix, db: trx },
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
});
