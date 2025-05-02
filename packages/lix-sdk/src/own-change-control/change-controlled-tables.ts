export const changeControlledTableIds = {
	account: ["id"],
	active_version: ["version_id"],
	// change_set: ["id"],
	change_set_edge: ["parent_id", "child_id"],
	// change_set_element: ["change_set_id", "change_id"],
	change_set_label: ["change_set_id", "label_id"],
	change_set_thread: ["change_set_id", "thread_id"],
	// Change author should be change controlled but
	// breaking the trigger loop turned out to be difficult.
	//
	// For the sake of getting lix v0.5 out, authors are not
	// change controlled. A future update should address this.
	// change_author: ["change_id", "account_id"],
	thread: ["id"],
	thread_comment: ["id"],
	file: ["id"],
	label: ["id"],
	key_value: ["key"],
	version: ["id"],
} as const;

/**
 * The result of a PRAGMA table_info call.
 *
 * @example
 *   	const tableInfo = sqlite.exec({
 *		  sql: `PRAGMA table_info(change_author);`,
 *		  returnValue: "resultRows",
 *		  rowMode: "object",
 *	  }) as PragmaTableInfo;
 */
export type PragmaTableInfo = Array<{
	/**
	 * The column name
	 */
	name: string;
	/**
	 * 0 if not a primary key
	 * 1 if primary key
	 * 2... if part of a multi-column primary key
	 */
	pk: number;
}>;

/**
 * Returns the entity id for a row in a change controlled table.
 */
export function entityIdForRow(
	/**
	 * The name of the table.
	 */
	tableName: keyof typeof changeControlledTableIds,
	/**
	 * The values of the row.
	 */
	...values: any[]
): string {
	let entityId = "";
	const primaryKeyColumns = changeControlledTableIds[tableName]!; // Get the specific array of PK columns

	// only has one primary key
	if (primaryKeyColumns.length === 1) {
		// If there's only one key, its index is 0. Assume the corresponding value is also at index 0 in 'values'.
		if (!values[0]) {
			throw new Error(
				`entityIdForRow: Missing value for single key in table '${tableName}'.`
			);
		}
		entityId = values[0];
	}
	// has compound primary key that are joined with a comma.
	else {
		const keyValues: string[] = [];
		for (let i = 0; i < primaryKeyColumns.length; i++) {
			if (!values[i]) {
				throw new Error(
					`entityIdForRow: Missing value for compound key part '${primaryKeyColumns[i]}' in table '${tableName}' at index ${i}.`
				);
			}
			keyValues.push(values[i]);
		}
		entityId = keyValues.join(",");
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
	tableName: keyof typeof changeControlledTableIds,
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
