import { test, expect } from "vitest";
import { createConversationMessage } from "./create-conversation-message.js";
import { openLix } from "../lix/open-lix.js";
import { fromPlainText } from "@opral/zettel-ast";
import { nanoId } from "../engine/functions/nano-id.js";

test("creates a conversation message", async () => {
	const lix = await openLix({});

	const conversationId = await nanoId({ lix });
	await lix.db
		.insertInto("conversation")
		.values({ id: conversationId })
		.execute();

	const conversation = await lix.db
		.selectFrom("conversation")
		.selectAll()
		.where("id", "=", conversationId)
		.executeTakeFirstOrThrow();

	const msg = await createConversationMessage({
		lix,
		conversation_id: conversation.id,
		body: fromPlainText("Hello world  "),
	});

	expect(msg).toBeDefined();
});

test("defaults to the version of the conversation", async () => {
	const lix = await openLix({});

	const conversationId = await nanoId({ lix });
	await lix.db
		.insertInto("conversation")
		.values({ id: conversationId })
		.execute();

	const activeVersionScoped = await lix.db
		.selectFrom("conversation")
		.selectAll()
		.where("id", "=", conversationId)
		.executeTakeFirstOrThrow();

	const m1 = await createConversationMessage({
		lix,
		conversation_id: activeVersionScoped.id,
		body: fromPlainText("Hello world  "),
	});

	expect(m1).toBeDefined();

	await lix.db
		.insertInto("conversation_by_version")
		.values({ id: "global-conv", lixcol_version_id: "global" })
		.execute();

	const globalMsg = await createConversationMessage({
		lix,
		conversation_id: "global-conv",
		body: fromPlainText("Hello global world  "),
	});

	expect(globalMsg).toBeDefined();
});

test("defaults parent_id to the last message when not provided (most recent leaf)", async () => {
	const lix = await openLix({});

	const conversationId = await nanoId({ lix });
	await lix.db
		.insertInto("conversation")
		.values({ id: conversationId })
		.execute();

	const conv = await lix.db
		.selectFrom("conversation")
		.selectAll()
		.where("id", "=", conversationId)
		.executeTakeFirstOrThrow();

	const first = await createConversationMessage({
		lix,
		conversation_id: conv.id,
		body: fromPlainText("First message"),
	});
	expect(first.parent_id).toBeNull();

	const second = await createConversationMessage({
		lix,
		conversation_id: conv.id,
		body: fromPlainText("Second message"),
	});
	expect(second.parent_id).toBe(first.id);

	const third = await createConversationMessage({
		lix,
		conversation_id: conv.id,
		body: fromPlainText("Third message"),
	});
	expect(third.parent_id).toBe(second.id);

	const fourth = await createConversationMessage({
		lix,
		conversation_id: conv.id,
		body: fromPlainText("Fourth message"),
		parent_id: first.id,
	});
	expect(fourth.parent_id).toBe(first.id);

	const fifth = await createConversationMessage({
		lix,
		conversation_id: conv.id,
		body: fromPlainText("Fifth message"),
	});
	expect(fifth.parent_id).toBe(fourth.id);
});
