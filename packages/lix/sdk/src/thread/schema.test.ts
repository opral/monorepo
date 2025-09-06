import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { fromPlainText } from "@opral/zettel-ast";
import { switchAccount } from "../account/switch-account.js";

test("thread.id should default to nano_id", async () => {
	const lix = await openLix({});

	await lix.db.insertInto("thread").defaultValues().execute();

	const result = await lix.db
		.selectFrom("thread")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(result.id).toBeDefined();
});

test("an invalid thread comment content should throw an error", async () => {
	const lix = await openLix({});

	await lix.db.insertInto("thread").defaultValues().execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
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
	const lix = await openLix({});

	await lix.db.insertInto("thread").defaultValues().execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
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
		.executeTakeFirstOrThrow();

	expect(comment).toBeDefined();
});

test("creating a thread should create a change author", async () => {
	const lix = await openLix({});

	// Create an account first
	await lix.db
		.insertInto("account")
		.values({
			id: "test-account",
			name: "Test User",
		})
		.execute();

	// Switch to the test account
	await switchAccount({ lix, to: [{ id: "test-account", name: "Test User" }] });

	await lix.db.insertInto("thread").defaultValues().execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check that a change author was created for the thread
	const threadChangeAuthor = await lix.db
		.selectFrom("change_author")
		.where("change_author.change_id", "=", thread.lixcol_change_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(threadChangeAuthor).toBeDefined();
	expect(threadChangeAuthor.account_id).toBe("test-account");
});

test("creating a thread comment should create a change author", async () => {
	const lix = await openLix({});

	// Create an account first
	await lix.db
		.insertInto("account")
		.values({
			id: "test-account",
			name: "Test User",
		})
		.execute();

	// Switch to the test account
	await switchAccount({ lix, to: [{ id: "test-account", name: "Test User" }] });

	await lix.db.insertInto("thread").defaultValues().execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("thread_comment")
		.values({
			thread_id: thread.id,
			parent_id: null,
			body: fromPlainText("Test comment"),
		})
		.execute();

	const comment = await lix.db
		.selectFrom("thread_comment")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check that a change author was created for the comment
	const commentChangeAuthor = await lix.db
		.selectFrom("change_author")
		.where("change_author.change_id", "=", comment.lixcol_change_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(commentChangeAuthor).toBeDefined();
	expect(commentChangeAuthor.account_id).toBe("test-account");
});
