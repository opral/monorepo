import type { Lix } from "../../lix/open-lix.js";
import type { LixEntity, LixEntityCanonical } from "../schema.js";

/**
 * Creates a mapping between an entity and a conversation.
 */
export async function attachConversation(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity | LixEntityCanonical;
	conversation: { id: string };
	versionId?: string;
}): Promise<void> {
	const { lix, entity, conversation } = args;

	const entity_id =
		"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
	const schema_key =
		"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
	const file_id = "file_id" in entity ? entity.file_id : entity.lixcol_file_id;

	const versionId = args.versionId ?? "global";

	const existingMapping = await lix.db
		.selectFrom("entity_conversation_all")
		.where("entity_id", "=", entity_id)
		.where("schema_key", "=", schema_key)
		.where("file_id", "=", file_id)
		.where("conversation_id", "=", conversation.id)
		.where("lixcol_version_id", "=", versionId)
		.select(["entity_id"])
		.executeTakeFirst();

	if (existingMapping) return;

	await lix.db
		.insertInto("entity_conversation_all")
		.values({
			entity_id,
			schema_key,
			file_id,
			conversation_id: conversation.id,
			lixcol_version_id: versionId,
		})
		.execute();
}

/**
 * Deletes a mapping between an entity and a conversation.
 */
export async function removeConversation(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity | LixEntityCanonical;
	conversation: { id: string };
	versionId?: string;
}): Promise<void> {
	const { lix, entity, conversation } = args;

	const entity_id =
		"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
	const schema_key =
		"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
	const file_id = "file_id" in entity ? entity.file_id : entity.lixcol_file_id;

	const versionId = args.versionId ?? "global";

	await lix.db
		.deleteFrom("entity_conversation_all")
		.where("entity_id", "=", entity_id)
		.where("schema_key", "=", schema_key)
		.where("file_id", "=", file_id)
		.where("conversation_id", "=", conversation.id)
		.where("lixcol_version_id", "=", versionId)
		.execute();
}
