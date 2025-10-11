import type { LixEngine } from "../../engine/boot.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { sql } from "kysely";

export function storeDetectedChangeSchema(args: {
	engine: Pick<LixEngine, "executeSync">;
	schema: LixSchemaDefinition;
	untracked?: boolean;
}): void {
	const schemaKey = args.schema["x-lix-key"];
	const schemaVersion = args.schema["x-lix-version"];

	// Check if schema already exists
	const [existingSchema] = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("stored_schema")
			.select("value")
			.where(
				sql`json_extract("stored_schema"."value", '$."x-lix-key"')`,
				"=",
				schemaKey
			)
			.where(
				sql`json_extract("stored_schema"."value", '$."x-lix-version"')`,
				"=",
				schemaVersion
			)
			.limit(1)
			.compile()
	).rows;

	if (existingSchema) {
		// Compare schemas using JSON.stringify for strict determinism
		// Handle case where stored value might already be stringified
		const existingSchemaJson =
			typeof existingSchema.value === "string"
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

		args.engine.executeSync(
			internalQueryBuilder
				.insertInto("stored_schema")
				.values({
					value: args.schema,
					lixcol_untracked: args.untracked || false,
				})
				.compile()
		);
	}
}
