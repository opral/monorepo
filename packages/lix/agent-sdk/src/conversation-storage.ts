import type { Lix } from "@lix-js/sdk";
import { createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText, toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type { ChatMessage } from "./send-message.js";

const DEFAULT_CONVERSATION_ID_KEY = "lix_agent_conversation_id";

export async function getOrCreateDefaultAgentConversationId(
	lix: Lix
): Promise<string> {
	const row = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", DEFAULT_CONVERSATION_ID_KEY)
		.select(["value"])
		.executeTakeFirst();

	const storedValue = row?.value;
	if (typeof storedValue === "string") {
		return storedValue;
	}

	const conv = await createConversation({ lix, versionId: "global" });
	await setDefaultAgentConversationId(lix, conv.id);
	return conv.id;
}

export async function setDefaultAgentConversationId(
	lix: Lix,
	conversationId: string
): Promise<void> {
	await lix.db.transaction().execute(async (trx) => {
		const exists = await trx
			.selectFrom("key_value_all")
			.where("lixcol_version_id", "=", "global")
			.where("key", "=", DEFAULT_CONVERSATION_ID_KEY)
			.select(["key"])
			.executeTakeFirst();

		if (exists) {
			await trx
				.updateTable("key_value_all")
				.set({ value: conversationId, lixcol_untracked: true })
				.where("key", "=", DEFAULT_CONVERSATION_ID_KEY)
				.where("lixcol_version_id", "=", "global")
				.execute();
		} else {
			await trx
				.insertInto("key_value_all")
				.values({
					key: DEFAULT_CONVERSATION_ID_KEY,
					value: conversationId,
					lixcol_version_id: "global",
					lixcol_untracked: true,
				})
				.execute();
		}
	});
}

export async function appendUserMessage(
	lix: Lix,
	conversationId: string,
	text: string,
	metadata?: Record<string, any>
): Promise<void> {
	await createConversationMessage({
		lix,
		conversation_id: conversationId,
		body: fromPlainText(text),
		lixcol_metadata: {
			lix_agent_role: "user",
			...(metadata ?? {}),
		},
	});
}

export async function appendAssistantMessage(
	lix: Lix,
	conversationId: string,
	text: string,
	metadata?: Record<string, any>
): Promise<void> {
	await createConversationMessage({
		lix,
		conversation_id: conversationId,
		body: fromPlainText(text),
		lixcol_metadata: {
			lix_agent_role: "assistant",
			...(metadata ?? {}),
		},
	});
}

export async function loadConversationHistory(
	lix: Lix,
	conversationId: string
): Promise<ChatMessage[]> {
	const rows = await lix.db
		.selectFrom("conversation_message")
		.where("conversation_id", "=", conversationId)
		.select(["id", "body", "lixcol_metadata", "lixcol_created_at"]) // created_at for ordering
		.orderBy("lixcol_created_at", "asc")
		.orderBy("id", "asc")
		.execute();

	type ConversationRow = (typeof rows)[number] & {
		lixcol_metadata: Record<string, any> | null;
	};
	const history: ChatMessage[] = [];
	for (const r of rows as ConversationRow[]) {
		const role = (r.lixcol_metadata?.lix_agent_role as string) ?? "assistant";
		const metadata =
			(r.lixcol_metadata as Record<string, any> | null | undefined) ??
			undefined;
		const content = toPlainText(r.body).replace(
			/^\[(user|assistant)\]\s*/i,
			""
		);
		if (role === "user" || role === "assistant") {
			history.push({
				id: String(r.id),
				role,
				content,
				metadata,
			});
		}
	}
	return history;
}
