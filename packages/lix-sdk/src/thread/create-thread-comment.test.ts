import { test, expect } from "vitest";
import { createThreadComment } from "./create-thread-comment.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fromPlainText } from "@opral/zettel-ast";

test("creates a thread comment", async () => {
	const lix = await openLixInMemory({});

	const thread = await lix.db
		.insertInto("thread")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const threadComment = await createThreadComment({
		lix,
		thread_id: thread.id,
		body: fromPlainText("Hello world  "),
	});

	expect(threadComment).toBeDefined();
});
