import type { Lix } from "../../lix/open-lix.js";
import type { LixEntity, LixEntityCanonical } from "../schema.js";

/**
 * Attaches a label to an entity (creates mapping).
 *
 * This function allows any entity in the system to be labeled,
 * enabling universal labeling across all entity types.
 *
 * @example
 * // Label a bundle entity
 * await attachLabel({
 *   lix,
 *   entity: {
 *     entity_id: "bundle123",
 *     schema_key: "inlang_bundle",
 *     file_id: "messages.json"
 *   },
 *   label: { id: "needs-translation-label-id" }
 * });
 *
 * @example
 * // Label a change set
 * await attachLabel({
 *   lix,
 *   entity: {
 *     entity_id: "cs123",
 *     schema_key: "lix_change_set",
 *     file_id: "lix"
 *   },
 *   label: { id: "reviewed-label-id" }
 * });
 */
export async function attachLabel(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity | LixEntityCanonical;
	label: { id: string };
}): Promise<void> {
	const { lix, entity, label } = args;

	// Extract entity fields - support both canonical and lixcol_ prefixed names
	const entity_id =
		"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
	const schema_key =
		"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
	const file_id = "file_id" in entity ? entity.file_id : entity.lixcol_file_id;

	// Check if the mapping already exists
	const existingMapping = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", entity_id)
		.where("schema_key", "=", schema_key)
		.where("file_id", "=", file_id)
		.where("label_id", "=", label.id)
		.select(["entity_id"])
		.executeTakeFirst();

	if (existingMapping) {
		// Mapping already exists, nothing to do
		return;
	}

	// Create the entity-label mapping
	// Foreign key constraints will automatically validate that:
	// - The entity exists in state
	// - The label exists
	await lix.db
		.insertInto("entity_label")
		.values({
			entity_id: entity_id,
			schema_key: schema_key,
			file_id: file_id,
			label_id: label.id,
		})
		.execute();
}

/**
 * Detaches a label from an entity (removes mapping).
 *
 * @example
 * await detachLabel({
 *   lix,
 *   entity: {
 *     entity_id: "bundle123",
 *     schema_key: "inlang_bundle",
 *     file_id: "messages.json"
 *   },
 *   label: { id: "needs-translation-label-id" }
 * });
 */
export async function detachLabel(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity | LixEntityCanonical;
	label: { id: string };
}): Promise<void> {
	const { lix, entity, label } = args;

	// Extract entity fields - support both canonical and lixcol_ prefixed names
	const entity_id =
		"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
	const schema_key =
		"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
	const file_id = "file_id" in entity ? entity.file_id : entity.lixcol_file_id;

	await lix.db
		.deleteFrom("entity_label")
		.where("entity_id", "=", entity_id)
		.where("schema_key", "=", schema_key)
		.where("file_id", "=", file_id)
		.where("label_id", "=", label.id)
		.execute();
}
