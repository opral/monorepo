import { expect, test } from "vitest";
import { openLix, createConversation } from "@lix-js/sdk";
import {
	appendAssistantMessage,
	appendUserMessage,
	getOrCreateDefaultAgentConversationId,
	loadConversationHistory,
	setDefaultAgentConversationId,
} from "./conversation-storage.js";

const DEFAULT_CONVERSATION_ID_KEY = "lix_agent_conversation_id";

test("getOrCreateDefaultAgentConversationId stores and reuses the default conversation id", async () => {
	const lix = await openLix({});

	const firstId = await getOrCreateDefaultAgentConversationId(lix);
	expect(typeof firstId).toBe("string");

	const stored = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", DEFAULT_CONVERSATION_ID_KEY)
		.select(["value"])
		.executeTakeFirstOrThrow();

	expect(stored.value).toBe(firstId);

	const foundConversation = await lix.db
		.selectFrom("conversation")
		.where("id", "=", firstId)
		.select(["id"])
		.executeTakeFirst();
	expect(foundConversation?.id).toBe(firstId);

	const secondId = await getOrCreateDefaultAgentConversationId(lix);
	expect(secondId).toBe(firstId);

	await lix.close();
});

test("setDefaultAgentConversationId overwrites the stored conversation id", async () => {
	const lix = await openLix({});

	const initialId = await getOrCreateDefaultAgentConversationId(lix);

	const replacementConversation = await createConversation({
		lix,
		versionId: "global",
	});

	await setDefaultAgentConversationId(lix, replacementConversation.id);

	const resolvedConversationId =
		await getOrCreateDefaultAgentConversationId(lix);
	expect(resolvedConversationId).toBe(replacementConversation.id);

	const allConversations = await lix.db
		.selectFrom("conversation")
		.select(["id"])
		.execute();
	expect(allConversations.map((row) => row.id)).toEqual(
		expect.arrayContaining([initialId, replacementConversation.id])
	);
	expect(allConversations).toHaveLength(2);

	await lix.close();
});

test("append message helpers persist metadata and loadConversationHistory normalizes content", async () => {
	const lix = await openLix({});

	const conversationId = await getOrCreateDefaultAgentConversationId(lix);

	await appendUserMessage(lix, conversationId, "[user] Hello there", {
		topic: "greeting",
	});
	await appendAssistantMessage(lix, conversationId, "[assistant] Hi friend!", {
		confidence: 0.5,
	});

	const history = await loadConversationHistory(lix, conversationId);
	expect(history).toHaveLength(2);

	expect(history[0]).toMatchObject({
		role: "user",
		content: "Hello there",
		metadata: { lix_agent_role: "user", topic: "greeting" },
	});

	expect(history[1]).toMatchObject({
		role: "assistant",
		content: "Hi friend!",
		metadata: { lix_agent_role: "assistant", confidence: 0.5 },
	});

	await lix.close();
});
