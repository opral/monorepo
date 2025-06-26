import { test, expect } from "vitest";
import { createThreadComment } from "./create-thread-comment.js";
import { openLix } from "../lix/open-lix.js";
import { fromPlainText } from "@opral/zettel-ast";
import { nanoid } from "../database/nano-id.js";

test("creates a thread comment", async () => {
	const lix = await openLix({});

	const threadId = nanoid();
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

	const threadId = nanoid();
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
