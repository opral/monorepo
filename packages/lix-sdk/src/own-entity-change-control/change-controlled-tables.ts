import type { LixDatabaseSchema } from "../database/schema.js";

export const changeControlledTables: Partial<{
	[K in keyof LixDatabaseSchema]: TableColumns<LixDatabaseSchema[K]>;
}> = {
	account: ["id", "name"],
	comment: [
		"id",
		"content",
		"created_at",
		"created_by",
		"parent_id",
		"discussion_id",
	],
	change_set: ["id"],
	change_author: ["change_id", "account_id"],
	change_set_element: ["change_set_id", "change_id"],
	change_set_label: ["label_id", "change_set_id"],
	change_set_label_author: ["label_id", "change_set_id", "account_id"],
	discussion: ["id", "change_set_id"],
	// file: ["id", "path", "metadata"],
	key_value: ["key", "value"],
	version: ["id", "name"],
};

export const changeControlledTableIds: Partial<{
	[K in keyof LixDatabaseSchema]: TableColumns<LixDatabaseSchema[K]>;
}> = {
	account: ["id"],
	comment: ["id"],
	change_set: ["id"],
	change_author: ["change_id", "account_id"],
	change_set_element: ["change_set_id", "change_id"],
	change_set_label: ["label_id", "change_set_id"],
	change_set_label_author: ["label_id", "change_set_id", "account_id"],
	discussion: ["id"],
	file: ["id"],
	key_value: ["key"],
	version: ["id"],
};

/**
 * Returns the entity id for a row in a change controlled table.
 */
export function entityIdForRow(
	/**
	 * The name of the table.
	 */
	tableName: keyof LixDatabaseSchema,
	/**
	 * The values of the row.
	 */
	...values: any[]
): string {
	let entityId = "";

	// only has one primary key
	if (changeControlledTableIds[tableName]!.length === 1) {
		const index = changeControlledTables[tableName]!.indexOf(
			// @ts-expect-error - no clue why
			changeControlledTableIds[tableName]![0]
		);
		entityId = values[index];
	}
	// has compound primary key that are joined with a comma.
	else {
		for (const column of changeControlledTableIds[tableName]!) {
			const index = changeControlledTables[tableName]!.indexOf(
				// @ts-expect-error - no clue why
				column
			);
			if (entityId === "") {
				entityId = values[index];
			} else {
				entityId = [entityId, values[index]].join(",");
			}
		}
	}
	return entityId;
}

/**
 * Returns the primary keys for a row in a change controlled table.
 */
export function primaryKeysForEntityId(
	/**
	 * The name of the table.
	 */
	tableName: keyof LixDatabaseSchema,
	/**
	 * The values of the row.
	 */
	entitiyId: string
): [string, any][] {
	const primaryKeys = changeControlledTableIds[tableName]!;

	if (primaryKeys.length === 1) {
		return [[primaryKeys[0]!, entitiyId]];
	} else {
		return entitiyId.split(",").map((id, index) => [primaryKeys[index]!, id]);
	}
}

type TableColumns<T> = T extends Record<string, any> ? (keyof T)[] : never;
