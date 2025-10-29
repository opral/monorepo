import type { Lix } from "../lix/open-lix.js";
import type { NewState, State } from "../engine/entity-views/types.js";
import type { LixConversationMessage } from "./schema-definition.js";
import { nanoId } from "../engine/functions/nano-id.js";

/**
 * Adds a message to an existing conversation.
 * In DB terms: inserts a row into `conversation_message[_all]`.
 */
export async function createConversationMessage(
	args: { lix: Lix } & NewState<LixConversationMessage>
): Promise<State<LixConversationMessage>> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const messageId = args.id ?? (await nanoId({ lix: args.lix }));

		const existingConversation = await trx
			.selectFrom("conversation_all")
			.where("id", "=", args.conversation_id)
			.where("lixcol_inherited_from_version_id", "is", null)
			.select("lixcol_version_id")
			.executeTakeFirstOrThrow();

		// Default parent to most recent leaf
		let parentId = args.parent_id as string | null | undefined;
		if (parentId === undefined) {
			const leaf = await trx
				.selectFrom("conversation_message_all as m1")
				.where("m1.conversation_id", "=", args.conversation_id)
				.where(
					"m1.lixcol_version_id",
					"=",
					existingConversation.lixcol_version_id
				)
				.where((eb) =>
					eb.not(
						eb.exists(
							eb
								.selectFrom("conversation_message_all as m2")
								.where("m2.conversation_id", "=", args.conversation_id)
								.where(
									"m2.lixcol_version_id",
									"=",
									existingConversation.lixcol_version_id
								)
								.whereRef("m2.parent_id", "=", "m1.id")
								.select("m2.id")
						)
					)
				)
				.select(["m1.id", "m1.lixcol_created_at"])
				.orderBy("m1.lixcol_created_at", "desc")
				.orderBy("m1.id", "desc")
				.executeTakeFirst();
			parentId = leaf?.id ?? null;
		}

		await trx
			.insertInto("conversation_message_all")
			.values({
				id: messageId,
				conversation_id: args.conversation_id,
				body: args.body,
				lixcol_metadata: args.lixcol_metadata ?? undefined,
				parent_id: parentId,
				lixcol_version_id: existingConversation.lixcol_version_id,
			})
			.execute();

		return await trx
			.selectFrom("conversation_message_all")
			.selectAll()
			.where("id", "=", messageId)
			.where("lixcol_version_id", "=", existingConversation.lixcol_version_id)
			.executeTakeFirstOrThrow();
	};

	if (args.lix.db.isTransaction) {
		return await executeInTransaction(args.lix.db);
	} else {
		return await args.lix.db.transaction().execute(executeInTransaction);
	}
}
