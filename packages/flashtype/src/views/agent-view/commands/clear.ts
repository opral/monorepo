import type { Lix } from "@lix-js/sdk";
import type { LixAgent } from "@lix-js/agent-sdk";

const CONVERSATION_KEY = "lix_agent_conversation_id";

/**
 * Clears the current conversation by removing all messages in a safe order.
 */
export async function clearConversation(args: {
	lix: Lix;
	agent: LixAgent | null;
}): Promise<string | null> {
	const { lix, agent } = args;

	if (agent) {
		agent.clearHistory();
	}

	const currentId = await getConversationId(lix);
	if (!currentId) {
		return null;
	}

	await lix.db.transaction().execute(async (trx) => {
		const messageIds = await trx
			.selectFrom("conversation_message_all")
			.where("conversation_id", "=", currentId)
			.where("lixcol_version_id", "=", "global")
			.orderBy("lixcol_created_at", "desc")
			.orderBy("id", "desc")
			.select("id")
			.execute();

		for (const row of messageIds) {
			await trx
				.deleteFrom("conversation_message_all")
				.where("id", "=", row.id as string)
				.where("lixcol_version_id", "=", "global")
				.execute();
		}
	});

	return currentId;
}

async function getConversationId(lix: Lix): Promise<string | null> {
	const row = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", CONVERSATION_KEY)
		.select(["value"])
		.executeTakeFirst();
	return typeof row?.value === "string" && row.value.length > 0
		? (row.value as string)
		: null;
}
