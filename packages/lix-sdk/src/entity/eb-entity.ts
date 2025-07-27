import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from "kysely";
import type { LixDatabaseSchema } from "../database/schema.js";
import type { LixEntity, LixEntityCanonical } from "./schema.js";

/**
 * List of tables that use canonical column names (entity_id, schema_key, file_id)
 * instead of the lixcol_ prefixed versions used by entity views.
 */
const CANONICAL_TABLES = ["state", "state_all", "entity_label", "entity_thread", "entity_thread_all"] as const;

/**
 * Entity Expression Builder - provides fluent API for entity operations in queries.
 *
 * This allows for more readable query syntax like:
 * .where(ebEntity("file").hasLabel({ name: "important" }))
 * .where(ebEntity("state").equals(userAccount))
 * .where(ebEntity().in(entities)) // When context is unambiguous (no joins)
 *
 * @param entityType - The type of entity table being queried (e.g., "file", "account", "thread").
 *                     Optional when the context is unambiguous (e.g., single table queries with no joins).
 */
export function ebEntity<
	TB extends keyof LixDatabaseSchema = keyof LixDatabaseSchema,
>(entityType?: TB) {
	// When entityType is provided, determine column names based on table type
	const isCanonicalTable = entityType
		? CANONICAL_TABLES.includes(entityType as any)
		: undefined;

	// Helper to detect which column naming convention is used based on the entity object
	const detectColumnType = (entity: any): boolean => {
		// If entity has canonical columns, it's from a canonical table
		return (
			"entity_id" in entity && "schema_key" in entity && "file_id" in entity
		);
	};

	// Get column names based on table type or entity structure
	const getColumnNames = (entity?: any) => {
		if (entityType !== undefined) {
			// Table explicitly provided - use the appropriate columns
			return {
				entityIdCol: isCanonicalTable ? "entity_id" : "lixcol_entity_id",
				schemaKeyCol: isCanonicalTable ? "schema_key" : "lixcol_schema_key",
				fileIdCol: isCanonicalTable ? "file_id" : "lixcol_file_id",
			};
		}

		// No table provided - detect from entity if available
		if (entity) {
			const useCanonical = detectColumnType(entity);
			return {
				entityIdCol: useCanonical ? "entity_id" : "lixcol_entity_id",
				schemaKeyCol: useCanonical ? "schema_key" : "lixcol_schema_key",
				fileIdCol: useCanonical ? "file_id" : "lixcol_file_id",
			};
		}

		// Default to lixcol_ for views (most common case)
		return {
			entityIdCol: "lixcol_entity_id",
			schemaKeyCol: "lixcol_schema_key",
			fileIdCol: "lixcol_file_id",
		};
	};

	return {
		/**
		 * Creates a filter that matches entities having the specified label.
		 *
		 * @param label - The label to filter by (either { name: "..." } or { id: "..." })
		 * @returns Expression wrapper for use in WHERE clauses
		 *
		 * @example
		 *   ```ts
		 *   await lix.db.selectFrom("file")
		 *      .where(ebEntity("file").hasLabel({ name: "important" }))
		 *      .selectAll()
		 *      .execute();
		 *   ```
		 */
		hasLabel(
			label: { id: string; name?: string } | { name: string; id?: string }
		) {
			return (
				eb: ExpressionBuilder<LixDatabaseSchema, TB>
			): ExpressionWrapper<LixDatabaseSchema, TB, SqlBool> => {
				const { entityIdCol } = getColumnNames();
				const columnRef = entityType
					? `${entityType}.${entityIdCol}`
					: entityIdCol;
				return eb(eb.ref(columnRef as any), "in", (subquery: any) =>
					subquery
						.selectFrom("entity_label")
						.innerJoin("label", "label.id", "entity_label.label_id")
						.select("entity_label.entity_id")
						.$if("name" in label, (qb: any) =>
							qb.where("label.name", "=", label.name!)
						)
						.$if("id" in label, (qb: any) =>
							qb.where("label.id", "=", label.id!)
						)
				);
			};
		},

		/**
		 * Creates a filter that matches entities equal to the specified entity.
		 *
		 * @param entity - The entity to match against (must have entity_id, schema_key, file_id)
		 * @returns Expression wrapper for use in WHERE clauses
		 *
		 * @example
		 *   ```ts
		 *   await lix.db.selectFrom("account")
		 *      .where(ebEntity("account").equals(targetAccount))
		 *      .selectAll()
		 *      .execute();
		 *   ```
		 */
		equals(entity: LixEntity | LixEntityCanonical) {
			return (
				eb: ExpressionBuilder<LixDatabaseSchema, TB>
			): ExpressionWrapper<LixDatabaseSchema, TB, SqlBool> => {
				// Extract entity fields - support both canonical and lixcol_ prefixed names
				const targetEntityId =
					"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id;
				const targetSchemaKey =
					"schema_key" in entity ? entity.schema_key : entity.lixcol_schema_key;
				const targetFileId =
					"file_id" in entity ? entity.file_id : entity.lixcol_file_id;

				const { entityIdCol, schemaKeyCol, fileIdCol } = getColumnNames(entity);
				// Prefix with table name if provided to avoid ambiguity in joins
				const entityIdRef = entityType
					? `${entityType}.${entityIdCol}`
					: entityIdCol;
				const schemaKeyRef = entityType
					? `${entityType}.${schemaKeyCol}`
					: schemaKeyCol;
				const fileIdRef = entityType ? `${entityType}.${fileIdCol}` : fileIdCol;

				return eb.and([
					eb(eb.ref(entityIdRef as any), "=", targetEntityId),
					eb(eb.ref(schemaKeyRef as any), "=", targetSchemaKey),
					eb(eb.ref(fileIdRef as any), "=", targetFileId),
				]);
			};
		},

		/**
		 * Creates a filter that matches entities in the specified list.
		 *
		 * @param entities - Array of entities to match against
		 * @returns Expression wrapper for use in WHERE clauses
		 *
		 * @example
		 *   ```ts
		 *   await lix.db.selectFrom("thread")
		 *      .where(ebEntity("thread").in([thread1, thread2, thread3]))
		 *      .selectAll()
		 *      .execute();
		 *   ```
		 */
		in(
			entities: Array<
				| { entity_id: string; schema_key: string; file_id: string }
				| {
						lixcol_entity_id: string;
						lixcol_schema_key: string;
						lixcol_file_id: string;
				  }
			>
		) {
			return (
				eb: ExpressionBuilder<LixDatabaseSchema, TB>
			): ExpressionWrapper<LixDatabaseSchema, TB, SqlBool> => {
				if (entities.length === 0) {
					// Return a condition that's always false for empty arrays
					return eb.val(false);
				}

				// Extract entity IDs for the IN clause
				const entityIds = entities.map((entity) =>
					"entity_id" in entity ? entity.entity_id : entity.lixcol_entity_id
				);

				// Get column names based on first entity (assumes all entities use same convention)
				const { entityIdCol } = getColumnNames(entities[0]);
				const columnRef = entityType
					? `${entityType}.${entityIdCol}`
					: entityIdCol;
				return eb(eb.ref(columnRef as any), "in", entityIds);
			};
		},
	};
}
