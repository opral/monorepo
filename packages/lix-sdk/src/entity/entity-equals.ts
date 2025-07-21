import type { ExpressionBuilder } from "kysely";
import type { LixEntity } from "./schema.js";

type ColumnTriple = {
	entity_id: string;
	schema_key: string;
	file_id: string;
};

/**
 * Internal implementation for entity equality checks.
 * @private
 */
function _entityEquals(
	cols: ColumnTriple,
	entity: Pick<LixEntity, keyof ColumnTriple>,
	alias?: string
) {
	return (eb: ExpressionBuilder<any, any>) => {
		const col = (c: keyof ColumnTriple) =>
			alias ? `${alias}.${cols[c]}` : cols[c];

		return eb.and([
			eb(col("entity_id"), "=", entity.entity_id),
			eb(col("schema_key"), "=", entity.schema_key),
			eb(col("file_id"), "=", entity.file_id),
		]);
	};
}

// Column mappings
const LIXCOL: ColumnTriple = {
	entity_id: "lixcol_entity_id",
	schema_key: "lixcol_schema_key",
	file_id: "lixcol_file_id",
};

const CANONICAL: ColumnTriple = {
	entity_id: "entity_id",
	schema_key: "schema_key",
	file_id: "file_id",
};

/**
 * Creates a WHERE clause condition that matches an entity by its
 * lixcol_entity_id, lixcol_schema_key, and lixcol_file_id.
 *
 * Use this for entity views (account, label, thread, etc.) which use
 * lixcol_ prefixed columns.
 *
 * @example
 * const accounts = await lix.db
 *   .selectFrom("account")
 *   .where(entityEquals(entity))
 *   .selectAll()
 *   .execute();
 *
 * @example
 * // With table alias
 * const results = await lix.db
 *   .selectFrom("label as l")
 *   .where(entityEquals(entity, "l"))
 *   .execute();
 */
export const entityEquals = (
	entity: Pick<LixEntity, keyof ColumnTriple>,
	alias?: string
): ((eb: ExpressionBuilder<any, any>) => any) => _entityEquals(LIXCOL, entity, alias);

/**
 * Creates a WHERE clause condition that matches an entity by its
 * canonical columns: entity_id, schema_key, and file_id.
 *
 * Use this for tables that use canonical column names without the lixcol_ prefix:
 * state, state_all, state_history, entity_label.
 *
 * @example
 * const labels = await lix.db
 *   .selectFrom("entity_label")
 *   .where(entityEqualsCanonical(entity))
 *   .select(["label_id"])
 *   .execute();
 *
 * @example
 * // With table alias
 * const results = await lix.db
 *   .selectFrom("state as s")
 *   .where(entityEqualsCanonical(entity, "s"))
 *   .execute();
 */
export const entityEqualsCanonical = (
	entity: Pick<LixEntity, keyof ColumnTriple>,
	alias?: string
): ((eb: ExpressionBuilder<any, any>) => any) => _entityEquals(CANONICAL, entity, alias);
