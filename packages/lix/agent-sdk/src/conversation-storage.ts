import type { Lix } from "@lix-js/sdk";
import { createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type {
	AgentConversation,
	AgentConversationMessage,
	AgentConversationMessageMetadata,
} from "./types.js";

export async function appendUserMessage(
	lix: Lix,
	conversationId: string,
	text: string,
	metadata?: AgentConversationMessageMetadata
): Promise<void> {
	const baseMetadata: AgentConversationMessageMetadata = {
		...metadata,
		lix_agent_sdk_role: "user",
	};

	await createConversationMessage({
		lix,
		conversation_id: conversationId,
		body: fromPlainText(text),
		lixcol_metadata: baseMetadata,
	});
}

export async function appendAssistantMessage(
	lix: Lix,
	conversationId: string,
	text: string,
	metadata?: AgentConversationMessageMetadata
): Promise<void> {
	const baseMetadata: AgentConversationMessageMetadata = {
		...(metadata ?? {}),
		lix_agent_sdk_role: "assistant",
	};

	await createConversationMessage({
		lix,
		conversation_id: conversationId,
		body: fromPlainText(text),
		lixcol_metadata: baseMetadata,
	});
}

export async function loadConversation(
	lix: Lix,
	conversationId: string
): Promise<AgentConversation | null> {
	const conversationRow = await lix.db
		.selectFrom("conversation")
		.where("conversation.id", "=", conversationId)
		.select(["conversation.id"])
		.executeTakeFirst();

	if (!conversationRow) {
		return null;
	}

	const rows = await lix.db
		.selectFrom("conversation_message")
		.where("conversation_id", "=", conversationId)
		.select([
			"id",
			"conversation_id",
			"parent_id",
			"body",
			"lixcol_metadata",
			"lixcol_created_at",
		])
		.orderBy("lixcol_created_at", "asc")
		.orderBy("id", "asc")
		.execute();

	const messages = rows.map((row) => ({
		...row,
		id: String(row.id),
		conversation_id: String(row.conversation_id),
		parent_id:
			row.parent_id === null || row.parent_id === undefined
				? null
				: String(row.parent_id),
		lixcol_metadata: (row.lixcol_metadata ??
			null) as AgentConversationMessageMetadata | null,
	})) as AgentConversationMessage[];

	return {
		id: String(conversationRow.id),
		messages,
	};
}

/**
 * Persist the provided in-memory conversation to the Lix database.
 *
 * When `conversation.id` is omitted a new conversation is created under the
 * given version (defaults to `"global"`).
 *
 * @example
 * const turn = await sendMessage({
 * 	agent,
 * 	prompt: fromPlainText("Hello"),
 * 	persist: false,
 * });
 * await turn.toPromise();
 * await persistConversation({ lix, conversation: getAgentState(agent).conversation });
 */
export async function persistConversation(args: {
	lix: Lix;
	conversation: AgentConversation;
	versionId?: string;
}): Promise<AgentConversation> {
	const { lix, conversation, versionId = "global" } = args;
	let conversationId = await resolveConversationId({
		lix,
		requestedId: conversation.id,
		versionId,
	});

	for (const message of conversation.messages) {
		const metadata = (message.lixcol_metadata ?? {}) as
			| AgentConversationMessageMetadata
			| undefined;
		const role = metadata?.lix_agent_sdk_role;
		if (role !== "user" && role !== "assistant") {
			continue;
		}
		const enrichedMetadata: AgentConversationMessageMetadata = {
			...(metadata ?? {}),
			lix_agent_sdk_role: role,
		};

		const bodyDoc = message.body ?? fromPlainText("");

		await createConversationMessage({
			lix,
			conversation_id: conversationId,
			body: bodyDoc,
			lixcol_metadata: enrichedMetadata,
		});
	}

	return {
		id: conversationId,
		messages: conversation.messages.map((message) => ({
			...message,
			conversation_id: conversationId,
		})),
	};
}

async function resolveConversationId(args: {
	lix: Lix;
	requestedId?: string;
	versionId: string;
}): Promise<string> {
	const { lix, requestedId, versionId } = args;

	if (requestedId) {
		const existing = await lix.db
			.selectFrom("conversation_all")
			.where("id", "=", requestedId)
			.where("lixcol_inherited_from_version_id", "is", null)
			.select(["id"])
			.executeTakeFirst();
		if (existing) {
			return requestedId;
		}
	}

	const created = await createConversation({ lix, versionId });
	return created.id;
}
