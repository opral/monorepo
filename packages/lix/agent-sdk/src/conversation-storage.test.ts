import { expect, test } from "vitest";
import { openLix, createConversation } from "@lix-js/sdk";
import { fromPlainText, toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import {
	appendAssistantMessage,
	appendUserMessage,
	loadConversation,
	persistConversation,
} from "./conversation-storage.js";
import type { AgentConversation } from "./types.js";

test("append message helpers persist metadata and loadConversation returns stored messages", async () => {
	const lix = await openLix({});

	const conversation = await createConversation({ lix, versionId: "global" });

	await appendUserMessage(lix, conversation.id, "Hello there", {
		topic: "greeting",
	});
	await appendAssistantMessage(lix, conversation.id, "Hi friend!", {
		confidence: 0.5,
	});

	const stored = await loadConversation(lix, conversation.id);
	expect(stored).not.toBeNull();
	expect(stored?.messages).toHaveLength(2);

	const [first, second] = stored?.messages ?? [];
	expect(toPlainText(first!.body)).toBe("Hello there");
	expect(first?.lixcol_metadata).toMatchObject({
		lix_agent_sdk_role: "user",
		topic: "greeting",
	});

	expect(toPlainText(second!.body)).toBe("Hi friend!");
	expect(second?.lixcol_metadata).toMatchObject({
		lix_agent_sdk_role: "assistant",
		confidence: 0.5,
	});

	await lix.close();
});

test("persistConversation stores an in-memory conversation", async () => {
	const lix = await openLix({});

	const conversation: AgentConversation = {
		messages: [
			{
				id: "user-1",
				conversation_id: "",
				parent_id: null,
				body: fromPlainText("Hello"),
				lixcol_metadata: { lix_agent_sdk_role: "user" },
			},
			{
				id: "assistant-1",
				conversation_id: "",
				parent_id: null,
				body: fromPlainText("Hi there!"),
				lixcol_metadata: {
					lix_agent_sdk_role: "assistant",
					tone: "friendly",
				},
			},
		],
	};

	const persisted = await persistConversation({ lix, conversation });
	expect(persisted.id).toBeTruthy();

	const restored = await loadConversation(lix, persisted.id as string);
	expect(restored).not.toBeNull();
	expect(restored?.messages).toHaveLength(2);
	expect(toPlainText(restored!.messages[0]!.body)).toBe("Hello");
	expect(restored!.messages[1]?.lixcol_metadata?.tone).toBe("friendly");

	await lix.close();
});
