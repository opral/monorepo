import type { Lix } from "../../lix/open-lix.js";
import type { LixEntity, LixEntityCanonical } from "../schema.js";

/**
 * Creates a mapping between an entity and a thread.
 *
 * This function allows any entity in the system to have discussion threads,
 * enabling universal commenting across all entity types.
 *
 * @example
 * // Add thread to a markdown paragraph
 * await createEntityThread({
 *   lix,
 *   entity: {
 *     entity_id: "para_123",
 *     schema_key: "markdown_paragraph",
 *     file_id: "README.md"
 *   },
 *   thread: { id: "thread_001" }
 * });
 *
 * @example
 * // Add thread to a CSV cell
 * await createEntityThread({
 *   lix,
 *   entity: {
 *     entity_id: "row_789::column_2",
 *     schema_key: "csv_cell",
 *     file_id: "data.csv"
 *   },
 *   thread: { id: "thread_002" }
 * });
 *
 * @example
 * // Add thread to a change set
 * await createEntityThread({
 *   lix,
 *   entity: {
 *     entity_id: "cs123",
 *     schema_key: "lix_change_set",
 *     file_id: "lix"
 *   },
 *   thread: { id: "thread_003" }
 * });
 */
export async function createEntityThread(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity | LixEntityCanonical;
	thread: { id: string };
	versionId?: string;
}): Promise<void> {
	const { lix, entity, thread } = args;

	// Extract entity fields - support both canonical and lixcol_ prefixed names
	const entity_id =
		"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
	const schema_key =
		"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
	const file_id = "file_id" in entity ? entity.file_id : entity.lixcol_file_id;

	const versionId = args.versionId ?? "global";

	// Check if the mapping already exists
	const existingMapping = await lix.db
		.selectFrom("entity_thread_all")
		.where("entity_id", "=", entity_id)
		.where("schema_key", "=", schema_key)
		.where("file_id", "=", file_id)
		.where("thread_id", "=", thread.id)
		.where("lixcol_version_id", "=", versionId)
		.select(["entity_id"])
		.executeTakeFirst();

	if (existingMapping) {
		// Mapping already exists, nothing to do
		return;
	}

	// Create the entity-thread mapping
	// Foreign key constraints will automatically validate that:
	// - The entity exists in state
	// - The thread exists
	await lix.db
		.insertInto("entity_thread_all")
		.values({
			entity_id: entity_id,
			schema_key: schema_key,
			file_id: file_id,
			thread_id: thread.id,
			lixcol_version_id: versionId,
		})
		.execute();
}

/**
 * Deletes a mapping between an entity and a thread.
 *
 * @example
 * await deleteEntityThread({
 *   lix,
 *   entity: {
 *     entity_id: "para_123",
 *     schema_key: "markdown_paragraph",
 *     file_id: "README.md"
 *   },
 *   thread: { id: "thread_001" }
 * });
 */
export async function deleteEntityThread(args: {
	lix: Pick<Lix, "db">;
	entity: LixEntity | LixEntityCanonical;
	thread: { id: string };
	versionId?: string;
}): Promise<void> {
	const { lix, entity, thread } = args;

	// Extract entity fields - support both canonical and lixcol_ prefixed names
	const entity_id =
		"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
	const schema_key =
		"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
	const file_id = "file_id" in entity ? entity.file_id : entity.lixcol_file_id;

	const versionId = args.versionId ?? "global";

	await lix.db
		.deleteFrom("entity_thread_all")
		.where("entity_id", "=", entity_id)
		.where("schema_key", "=", schema_key)
		.where("file_id", "=", file_id)
		.where("thread_id", "=", thread.id)
		.where("lixcol_version_id", "=", versionId)
		.execute();
}
