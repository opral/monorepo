import type { Lix } from "../lix/open-lix.js";
import type {
	LixConversation,
	LixConversationMessage,
} from "./schema-definition.js";
import type { NewState, StateAll } from "../engine/entity-views/types.js";
import type { LixEntity, LixEntityCanonical } from "../entity/types.js";
import { attachConversation } from "../entity/conversation/attach-conversation.js";
import { nanoId } from "../engine/functions/nano-id.js";

/**
 * Starts a new conversation.
 *
 * Conversations allow collaborators to attach messages to a specific
 * version or entity. Initial messages can be provided and will be
 * inserted sequentially.
 *
 * @example
 * ```ts
 * // Create a standalone conversation
 * const conv = await createConversation({ lix, comments: [{ body: "Hello" }] })
 * ```
 *
 * @example
 * ```ts
 * // Create a conversation attached to an entity
 * const conv = await createConversation({
 *   lix,
 *   entity: { entity_id: "para_123", schema_key: "markdown_paragraph", file_id: "README.md" },
 *   comments: [{ body: "This paragraph needs review" }]
 * })
 * ```
 */
export async function createConversation(args: {
	lix: Lix;
	id?: string;
	comments?: (Pick<NewState<LixConversationMessage>, "body"> &
		Partial<Pick<NewState<LixConversationMessage>, "lixcol_metadata">>)[];
	/** defaults to global */
	versionId?: string;
	/** Optional entity to attach the conversation to */
	entity?: LixEntity | LixEntityCanonical;
}): Promise<
	StateAll<LixConversation> & {
		comments: StateAll<LixConversationMessage>[];
	}
> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const conversationId =
			args.id ?? (await nanoId({ lix: { ...args.lix, db: trx } }));
		const versionId = args.versionId ?? "global";

		await trx
			.insertInto("conversation_all")
			.values({ id: conversationId, lixcol_version_id: versionId })
			.execute();

		const conversation = await trx
			.selectFrom("conversation_all")
			.selectAll()
			.where("id", "=", conversationId)
			.where("lixcol_version_id", "=", versionId)
			.executeTakeFirstOrThrow();

		const insertedMessages = [] as any[];

		for (const [index, message] of (args.comments ?? []).entries()) {
			const messageId = await nanoId({ lix: { ...args.lix, db: trx } });

			await trx
				.insertInto("conversation_message_all")
				.values({
					id: messageId,
					conversation_id: conversation.id,
					body: message.body,
					lixcol_metadata: message.lixcol_metadata ?? undefined,
					parent_id: index > 0 ? insertedMessages[index - 1]!.id : null,
					lixcol_version_id: versionId,
				})
				.execute();

			const insertedMessage = await trx
				.selectFrom("conversation_message_all")
				.selectAll()
				.where("id", "=", messageId)
				.where("lixcol_version_id", "=", versionId)
				.executeTakeFirstOrThrow();

			insertedMessages.push(insertedMessage);
		}

		// If an entity is provided, create the entity-conversation mapping
		if (args.entity) {
			await attachConversation({
				lix: { db: trx },
				entity: args.entity,
				conversation: { id: conversationId },
				versionId: versionId,
			});
		}

		return { ...conversation, comments: insertedMessages };
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
