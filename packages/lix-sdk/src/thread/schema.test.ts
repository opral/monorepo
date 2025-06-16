import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fromPlainText } from "@opral/zettel-ast";

test("thread.id should default to nano_id", async () => {
	const lix = await openLixInMemory({});

	await lix.db.insertInto("thread").defaultValues().execute();

	const result = await lix.db
		.selectFrom("thread")
		.selectAll()
		.orderBy("state_version_id", "desc")
		.executeTakeFirstOrThrow();

	expect(result.id).toBeDefined();
});

test("an invalid thread comment content should throw an error", async () => {
	const lix = await openLixInMemory({});

	await lix.db.insertInto("thread").defaultValues().execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.orderBy("state_version_id", "desc")
		.executeTakeFirstOrThrow();

	await expect(
		async () =>
			await lix.db
				.insertInto("thread_comment")
				.values({
					thread_id: thread.id,
					parent_id: null,
					body: {
						type: "zettel_doc",
						content: [
							// @ts-expect-error - missing zettel_key prop
							{
								type: "zettel_text_block",
								style: "zettel_normal",
								children: [{ type: "zettel_span", text: "Hello world" }],
							},
						],
					},
				})
				.execute()
	).rejects.toThrowError();
});

test("valid thread comment content should pass", async () => {
	const lix = await openLixInMemory({});

	await lix.db.insertInto("thread").defaultValues().execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.orderBy("state_version_id", "desc")
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("thread_comment")
		.values({
			thread_id: thread.id,
			parent_id: null,
			body: fromPlainText("Hello world"),
		})
		.execute();

	const comment = await lix.db
		.selectFrom("thread_comment")
		.selectAll()
		.orderBy("state_version_id", "desc")
		.executeTakeFirstOrThrow();

	expect(comment).toBeDefined();
});
