import type { Lix } from "@lix-js/sdk";
import { createThread, createThreadComment } from "@lix-js/sdk";
import { fromPlainText, toPlainText } from "@lix-js/sdk/zettel-ast";
import type { ChatMessage } from "./send-message.js";

const POINTER_KEY = "lix_agent_thread_id";

export async function getOrCreateDefaultAgentThreadId(
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

	const thread = await createThread({ lix, versionId: "global" });
	await upsertThreadPointer(lix, thread.id);
	return thread.id;
}

export async function upsertThreadPointer(
	lix: Lix,
	threadId: string
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
			.set({ value: threadId, lixcol_untracked: true })
			.where("key", "=", POINTER_KEY)
			.where("lixcol_version_id", "=", "global")
			.execute();
	} else {
		await lix.db
			.insertInto("key_value_all")
			.values({
				key: POINTER_KEY,
				value: threadId,
				lixcol_version_id: "global",
				lixcol_untracked: true,
			})
			.execute();
	}
}

export async function appendUserComment(
	lix: Lix,
	threadId: string,
	text: string
): Promise<void> {
	await createThreadComment({
		lix,
		thread_id: threadId,
		body: fromPlainText(text),
		metadata: { lix_agent_role: "user" },
	} as any);
}

export async function appendAssistantComment(
	lix: Lix,
	threadId: string,
	text: string
): Promise<void> {
	await createThreadComment({
		lix,
		thread_id: threadId,
		body: fromPlainText(text),
		metadata: { lix_agent_role: "assistant" },
	} as any);
}

export async function loadThreadHistory(
	lix: Lix,
	threadId: string
): Promise<ChatMessage[]> {
	const rows = await lix.db
		.selectFrom("thread_comment")
		.where("thread_id", "=", threadId)
		.select(["id", "body", "metadata", "lixcol_created_at"]) // created_at for ordering hint if needed
		.orderBy("lixcol_created_at", "asc")
		.orderBy("id", "asc")
		.execute();

	const history: ChatMessage[] = [];
	for (const r of rows) {
		const role = ((r as any).metadata?.lix_agent_role as string) ?? "assistant";
		const content = toPlainText((r as any).body)
			// Normalize stray tags if any legacy content
			.replace(/^\[(user|assistant)\]\s*/i, "");
		if (role === "user" || role === "assistant") {
			history.push({ id: String((r as any).id), role, content });
		}
	}
	return history;
}
