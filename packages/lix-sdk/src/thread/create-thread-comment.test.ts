import { test, expect } from "vitest";
import { createThreadComment } from "./create-thread-comment.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fromPlainText } from "@opral/zettel-ast";
import { nanoid } from "../database/nano-id.js";

test("creates a thread comment", async () => {
	const lix = await openLixInMemory({});

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
