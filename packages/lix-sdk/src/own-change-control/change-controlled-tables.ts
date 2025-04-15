export const changeControlledTableIds = {
	account: ["id"],
	comment: ["id"],
	change_proposal: ["id"],
	change_set: ["id"],
	// Change author should be change controlled but
	// breaking the trigger loop turned out to be difficult.
	//
	// For the sake of getting lix v0.5 out, authors are not
	// change controlled. A future update should address this.
	// change_author: ["change_id", "account_id"],
	change_set_label: ["label_id", "change_set_id"],
	discussion: ["id"],
	file: ["id"],
	label: ["id"],
	key_value: ["key"],
	version: ["id"],
	// version_v2: ["id"],
	// version_change: ["version_id", "change_id"],
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

	// only has one primary key
	if (changeControlledTableIds[tableName]!.length === 1) {
		const index = changeControlledTableIds[tableName]!.indexOf(
			// @ts-expect-error - no clue why
			changeControlledTableIds[tableName]![0]
		);
		entityId = values[index];
	}
	// has compound primary key that are joined with a comma.
	else {
		for (const column of changeControlledTableIds[tableName]!) {
			const index = changeControlledTableIds[tableName]!.indexOf(column);
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
