import { executeSync } from "../database/execute-sync.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

export function storeDetectedChangeSchema(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
}): void {
	const schemaKey = args.schema["x-lix-key"];
	const schemaVersion = args.schema["x-lix-version"];
	
	// Check if schema already exists
	const existingSchema = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("stored_schema")
			.where("key", "=", schemaKey)
			.where("version", "=", schemaVersion)
			.select(["key", "version", "value"])
			.limit(1),
	})[0];

	if (existingSchema) {
		// Compare schemas using JSON.stringify for strict determinism
		// Handle case where stored value might already be stringified
		const existingSchemaJson = typeof existingSchema.value === 'string' 
			? existingSchema.value 
			: JSON.stringify(existingSchema.value);
		const newSchemaJson = JSON.stringify(args.schema);
		
		if (existingSchemaJson !== newSchemaJson) {
			throw new Error(
				`Schema differs from stored version for key '${schemaKey}' version '${schemaVersion}'. ` +
				`Please bump the schema version (x-lix-version) to use a different schema.`
			);
		}
		// Schemas match, continue
	} else {
		// Store new schema
		executeSync({
			lix: args.lix,
			query: args.lix.db.insertInto("stored_schema").values({
				key: schemaKey,
				version: schemaVersion,
				value: args.schema as any,
			}),
		});
	}
}