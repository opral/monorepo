import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { sql, type Kysely } from "kysely";
import {
	LixSchemaMap,
	type LixDatabaseSchema,
	type LixInternalDatabaseSchema,
} from "./schema.js";
import { executeSync } from "./execute-sync.js";
import { validateSchema } from "../schema/validate-schema.js";
import { isJsonType } from "../schema/json-type.js";

export function handleUpdateOnView(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	viewName: string,
	...data: Array<any>
): any {
	const schema = LixSchemaMap[viewName]!;
	const rowData = buildRowDataFromSchema(schema, data);
	const pk = schema["x-lix-primary-key"]!.map((key) => rowData[key]).join("::");

	validateSchema({
		lix: { sqlite, db: db as unknown as Kysely<LixDatabaseSchema> },
		schema,
		data: rowData,
	});

	// Insert new snapshot
	const [snapshot] = executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_snapshot")
			.values({
				content: sql`jsonb(${JSON.stringify(rowData)})`,
			})
			.returning("id"),
	});

	// Insert new change row
	executeSync({
		lix: { sqlite },
		query: db
			.insertInto("internal_change")
			.values({
				entity_id: pk,
				schema_key: "lix_" + viewName,
				snapshot_id: snapshot.id,
				file_id: "lix_own_change_control",
				plugin_key: "lix_own_change_control",
			})
			.returningAll(),
	});

	return JSON.stringify(rowData);
}

/**
 * Constructs a row data object from a flat key-value array and a JSON schema.
 * For properties defined as type "object" in the schema, this function will
 * attempt to parse string values as JSON before assignment. This ensures that
 * the resulting object matches the expected types for validation and insertion.
 *
 * @param schema - The JSON schema definition for the target view/table.
 * @param data - A flat array of alternating keys and values.
 * @returns An object mapping keys to values, with objects parsed as needed.
 */
export function buildRowDataFromSchema(
	schema: any,
	data: Array<any>
): Record<string, any> {
	const rowData: Record<string, any> = {};
	for (let i = 0; i < data.length; i += 2) {
		const key = data[i] as string;
		let value = data[i + 1];

		const propertyDefinition = schema.properties?.[key];
		if (propertyDefinition && typeof value === "string") {
			if (isJsonType(propertyDefinition)) {
				try {
					value = JSON.parse(value);
				} catch {
					// If parsing fails, value remains the original string.
					// Validation will catch this.
				}
			}
		}
		rowData[key] = value;
	}
	return rowData;
}

