import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fromPlainText } from "@opral/zettel-ast";

test("thread.id should default to nano_id", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.insertInto("thread")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result.id).toBeDefined();
});

test("an invalid thread comment content should throw an error", async () => {
	const lix = await openLixInMemory({});

	const thread = await lix.db
		.insertInto("thread")
		.defaultValues()
		.returningAll()
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
							// @ts-expect-error - missing _key prop
							{
								_type: "zettel.textBlock",
								style: "zettel.normal",
								markDefs: [],
								children: [{ _type: "zettel.span", text: "Hello world" }],
							},
						],
					},
				})
				.returningAll()
				.executeTakeFirstOrThrow()
	).rejects.toThrowError();
});

test("valid thread comment content should pass", async () => {
	const lix = await openLixInMemory({});

	const thread = await lix.db
		.insertInto("thread")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const comment = await lix.db
		.insertInto("thread_comment")
		.values({
			thread_id: thread.id,
			parent_id: null,
			body: fromPlainText("Hello world"),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(comment).toBeDefined();
});
