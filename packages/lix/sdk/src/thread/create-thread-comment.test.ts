import { test, expect } from "vitest";
import { createThreadComment } from "./create-thread-comment.js";
import { openLix } from "../lix/open-lix.js";
import { fromPlainText } from "@opral/zettel-ast";
import { nanoIdSync } from "../runtime/deterministic/index.js";

test("creates a thread comment", async () => {
	const lix = await openLix({});

	const threadId = nanoIdSync({ lix });
	await lix.db.insertInto("thread").values({ id: threadId }).execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.where("id", "=", threadId)
		.executeTakeFirstOrThrow();

	const threadComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("Hello world  "),
	});

	expect(threadComment).toBeDefined();
});

test("defaults to the version of the thread", async () => {
	const lix = await openLix({});

	const threadId = nanoIdSync({ lix });
	await lix.db.insertInto("thread").values({ id: threadId }).execute();

	const activeVersionScopedThread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.where("id", "=", threadId)
		.executeTakeFirstOrThrow();

	const threadComment = await createThreadComment({
		lix,
		thread_id: activeVersionScopedThread.id,
		body: fromPlainText("Hello world  "),
	});

	expect(threadComment).toBeDefined();

	await lix.db
		.insertInto("thread_all")
		.values({
			id: "global-thread",
			lixcol_version_id: "global",
		})
		.execute();

	const globalThreadComment = await createThreadComment({
		lix,
		thread_id: "global-thread",
		body: fromPlainText("Hello global world  "),
	});

	expect(globalThreadComment).toBeDefined();
});

test("defaults parent_id to the last comment when not provided", async () => {
	const lix = await openLix({});

	const threadId = nanoIdSync({ lix });
	await lix.db.insertInto("thread").values({ id: threadId }).execute();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.where("id", "=", threadId)
		.executeTakeFirstOrThrow();

	// Create first comment (should have parent_id = null)
	const firstComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("First comment"),
	});

	expect(firstComment.parent_id).toBeNull();

	// Create second comment without parent_id (should default to first comment)
	const secondComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("Second comment"),
	});

	expect(secondComment.parent_id).toBe(firstComment.id);

	// Create third comment without parent_id (should default to second comment)
	const thirdComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("Third comment"),
	});

	expect(thirdComment.parent_id).toBe(secondComment.id);

	// Create fourth comment with explicit parent_id (should use provided parent_id)
	const fourthComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("Fourth comment"),
		parent_id: firstComment.id,
	});

	expect(fourthComment.parent_id).toBe(firstComment.id);

	// Create fifth comment without parent_id
	// Should default to the most recently created leaf (fourth comment)
	// This follows common UI patterns where replies go to the most recent activity
	const fifthComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("Fifth comment"),
	});

	expect(fifthComment.parent_id).toBe(fourthComment.id);
});
