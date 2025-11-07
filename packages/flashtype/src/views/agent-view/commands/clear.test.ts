import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { clearConversation } from "./clear";
import { createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";

describe("clearConversation", () => {
	test("clears messages", async () => {
		const lix = await openLix({});

		const conversation = await createConversation({
			lix,
			versionId: "global",
		});

		await createConversationMessage({
			lix,
			conversation_id: conversation.id,
			body: fromPlainText("Hello world"),
		});

		await createConversationMessage({
			lix,
			conversation_id: conversation.id,
			body: fromPlainText("Second message"),
		});

		const messageCount = await countMessages(lix, conversation.id);

		expect(messageCount).toBe(2);

		await clearConversation({
			agent: { lix },
			conversationId: conversation.id,
		});

		const conversationAfter = await lix.db
			.selectFrom("conversation")
			.where("id", "=", conversation.id)
			.select("id")
			.executeTakeFirstOrThrow();

		expect(conversationAfter.id).toBe(conversation.id);

		const messageCountAfter = await countMessages(lix, conversationAfter.id);

		expect(messageCountAfter).toBe(0);
	});
});

async function countMessages(
	lix: Awaited<ReturnType<typeof openLix>>,
	conversationId: string,
) {
	const row = await lix.db
		.selectFrom("conversation_message")
		.where("conversation_id", "=", conversationId)
		.select(({ fn }) => fn.countAll<number>().as("count"))
		.executeTakeFirstOrThrow();
	return row.count;
}
