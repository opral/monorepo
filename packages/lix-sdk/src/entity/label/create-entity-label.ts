import type { Lix } from "../../lix/open-lix.js";
import type { LixEntity } from "../schema.js";

/**
 * Creates a mapping between an entity and a label.
 *
 * This function allows any entity in the system to be labeled,
 * enabling universal labeling across all entity types.
 *
 * @example
 * // Label a bundle entity
 * await createEntityLabel({
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
 * await createEntityLabel({
 *   lix,
 *   entity: {
 *     entity_id: "cs123",
 *     schema_key: "lix_change_set",
 *     file_id: "lix"
 *   },
 *   label: { id: "reviewed-label-id" }
 * });
 */
export async function createEntityLabel(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity;
	label: { id: string };
}): Promise<void> {
	const { lix, entity, label } = args;

	// Check if the entity exists in state
	const entityExists = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", entity.entity_id)
		.where("schema_key", "=", entity.schema_key)
		.where("file_id", "=", entity.file_id)
		.select(["entity_id"])
		.executeTakeFirst();

	if (!entityExists) {
		throw new Error(
			`Entity with id "${entity.entity_id}" (schema: ${entity.schema_key}, file: ${entity.file_id}) does not exist in state`
		);
	}

	// Check if the label exists
	const labelExists = await lix.db
		.selectFrom("label")
		.where("id", "=", label.id)
		.select(["id"])
		.executeTakeFirst();

	if (!labelExists) {
		throw new Error(`Label with id "${label.id}" does not exist`);
	}

	// Check if the mapping already exists
	const existingMapping = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", entity.entity_id)
		.where("schema_key", "=", entity.schema_key)
		.where("file_id", "=", entity.file_id)
		.where("label_id", "=", label.id)
		.select(["entity_id"])
		.executeTakeFirst();

	if (existingMapping) {
		// Mapping already exists, nothing to do
		return;
	}

	// Create the entity-label mapping
	await lix.db
		.insertInto("entity_label")
		.values({
			entity_id: entity.entity_id,
			schema_key: entity.schema_key,
			file_id: entity.file_id,
			label_id: label.id,
		})
		.execute();
}

/**
 * Deletes a mapping between an entity and a label.
 *
 * @example
 * await deleteEntityLabel({
 *   lix,
 *   entity: {
 *     entity_id: "bundle123",
 *     schema_key: "inlang_bundle",
 *     file_id: "messages.json"
 *   },
 *   label: { id: "needs-translation-label-id" }
 * });
 */
export async function deleteEntityLabel(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity;
	label: { id: string };
}): Promise<void> {
	const { lix, entity, label } = args;

	await lix.db
		.deleteFrom("entity_label")
		.where("entity_id", "=", entity.entity_id)
		.where("schema_key", "=", entity.schema_key)
		.where("file_id", "=", entity.file_id)
		.where("label_id", "=", label.id)
		.execute();
}

