import type { Lix } from "@lix-js/sdk";
import { createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText, toPlainText } from "@lix-js/sdk/zettel-ast";
import type { ChatMessage } from "./send-message.js";

const POINTER_KEY = "lix_agent_conversation_id";

export async function getOrCreateDefaultAgentConversationId(
	lix: Lix
): Promise<string> {
	const row = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", POINTER_KEY)
		.select(["value"])
		.executeTakeFirst();

	const id =
		(row?.value as any)?.value ??
		(row?.value as any)?.id ??
		(row as any)?.value;
	if (id && typeof id === "string") return id;

	const conv = await createConversation({ lix, versionId: "global" });
	await upsertConversationPointer(lix, conv.id);
	return conv.id;
}

export async function upsertConversationPointer(
	lix: Lix,
	conversationId: string
): Promise<void> {
	const exists = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", POINTER_KEY)
		.select(["key"])
		.executeTakeFirst();
	if (exists) {
		await lix.db
			.updateTable("key_value_all")
			.set({ value: conversationId, lixcol_untracked: true })
			.where("key", "=", POINTER_KEY)
			.where("lixcol_version_id", "=", "global")
			.execute();
	} else {
		await lix.db
			.insertInto("key_value_all")
			.values({
				key: POINTER_KEY,
				value: conversationId,
				lixcol_version_id: "global",
				lixcol_untracked: true,
			})
			.execute();
	}
}

export async function appendUserMessage(
	lix: Lix,
	conversationId: string,
	text: string
): Promise<void> {
	await createConversationMessage({
		lix,
		conversation_id: conversationId,
		body: fromPlainText(text),
		metadata: { lix_agent_role: "user" },
	} as any);
}

export async function appendAssistantMessage(
	lix: Lix,
	conversationId: string,
	text: string
): Promise<void> {
	await createConversationMessage({
		lix,
		conversation_id: conversationId,
		body: fromPlainText(text),
		metadata: { lix_agent_role: "assistant" },
	} as any);
}

export async function loadConversationHistory(
	lix: Lix,
	conversationId: string
): Promise<ChatMessage[]> {
	const rows = await lix.db
		.selectFrom("conversation_message")
		.where("conversation_id", "=", conversationId)
		.select(["id", "body", "metadata", "lixcol_created_at"]) // created_at for ordering
		.orderBy("lixcol_created_at", "asc")
		.orderBy("id", "asc")
		.execute();

	const history: ChatMessage[] = [];
	for (const r of rows as any[]) {
		const role = (r.metadata?.lix_agent_role as string) ?? "assistant";
		const content = toPlainText(r.body).replace(
			/^\[(user|assistant)\]\s*/i,
			""
		);
		if (role === "user" || role === "assistant") {
			history.push({ id: String(r.id), role, content });
		}
	}
	return history;
}
