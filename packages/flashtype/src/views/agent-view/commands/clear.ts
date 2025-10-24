import type { Agent } from "@lix-js/agent-sdk";
import type { LixConversation } from "@lix-js/sdk";

/**
 * Clears the current conversation by removing all messages in a safe order.
 */
export async function clearConversation(args: {
	agent: Pick<Agent, "lix">;
	conversationId: LixConversation["id"] | null;
}): Promise<void> {
	if (!args.conversationId) {
		return;
	}

	// need to delete the messages in order to avoid conflicts on parent_id
	return await args.agent.lix.db.transaction().execute(async (trx) => {
		const messages = await trx
			.selectFrom("conversation_message")
			.where("conversation_id", "=", args.conversationId!)
			.select("id")
			.orderBy("lixcol_created_at", "desc")
			.execute();

		for (const message of messages) {
			await trx
				.deleteFrom("conversation_message")
				.where("id", "=", message.id)
				.execute();
		}
	});
}
