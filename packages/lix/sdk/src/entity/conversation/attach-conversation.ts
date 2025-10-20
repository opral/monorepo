import type { Lix } from "../../lix/open-lix.js";
import type { LixEntity, LixEntityCanonical } from "../types.js";

/**
 * Attaches a conversation to an entity (creates mapping).
 *
 * @example
 * // Attach an existing conversation to an entity
 * await attachConversation({
 *   lix,
 *   entity: { entity_id: "para_123", schema_key: "markdown_paragraph", file_id: "README.md" },
 *   conversation: { id: "conv_123" }
 * });
 *
 * @example
 * // Scope the mapping to a specific version
 * await attachConversation({
 *   lix,
 *   entity: { entity_id: "para_123", schema_key: "markdown_paragraph", file_id: "README.md" },
 *   conversation: { id: "conv_123" },
 *   versionId: "v1"
 * });
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
 * Detaches a conversation from an entity (removes mapping).
 *
 * @example
 * await detachConversation({
 *   lix,
 *   entity: { entity_id: "para_123", schema_key: "markdown_paragraph", file_id: "README.md" },
 *   conversation: { id: "conv_123" }
 * });
 */
export async function detachConversation(args: {
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
