import { Ajv } from "ajv";
import type { Lix } from "../lix/open-lix.js";
import type { Snapshot } from "../snapshot/schema.js";
import { LixSchemaDefinition } from "../schema-definition/definition.js";
import { executeSync } from "../database/execute-sync.js";
import { sql } from "kysely";

const ajv = new Ajv({
	strict: true,
	// allow 'x-*' properties in alignment with new json schema spec
	// https://json-schema.org/blog/posts/stable-json-schema
	strictSchema: false,
});
const validateLixSchema = ajv.compile(LixSchemaDefinition);

export function validateStateMutation(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition | null;
	snapshot_content: Snapshot["content"];
}): void {
	if (!args.schema) {
		return;
	}

	const isValidLixSchema = validateLixSchema(args.schema);

	if (!isValidLixSchema) {
		throw new Error(
			`The provided schema is not a valid lix schema: ${ajv.errorsText(validateLixSchema.errors)}`
		);
	}

	const isValidSnapshotContent = ajv.validate(
		args.schema,
		args.snapshot_content
	);

	if (!isValidSnapshotContent) {
		const errorDetails = ajv.errors
			?.map((error) => {
				const receivedValue = error.instancePath
					? getValueByPath(args.snapshot_content, error.instancePath)
					: args.snapshot_content;
				return `${error.instancePath} ${error.message}. Received value: ${JSON.stringify(receivedValue)}`;
			})
			.join("; ");

		throw new Error(
			`The provided snapshot content does not match the schema: ${errorDetails || ajv.errorsText(ajv.errors)}`
		);
	}

	// Validate primary key constraints
	if (args.schema["x-lix-primary-key"]) {
		validatePrimaryKeyConstraints({
			lix: args.lix,
			schema: args.schema,
			snapshot_content: args.snapshot_content,
		});
	}

	// Validate unique constraints
	if (args.schema["x-lix-unique"]) {
		validateUniqueConstraints({
			lix: args.lix,
			schema: args.schema,
			snapshot_content: args.snapshot_content,
		});
	}

	// Validate foreign key constraints
	if (args.schema["x-lix-foreign-keys"]) {
		validateForeignKeyConstraints({
			lix: args.lix,
			schema: args.schema,
			snapshot_content: args.snapshot_content,
		});
	}
}

function validatePrimaryKeyConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: Snapshot["content"];
}): void {
	const primaryKeyFields = args.schema["x-lix-primary-key"];
	if (!primaryKeyFields || primaryKeyFields.length === 0) {
		return;
	}

	// Extract primary key values from the snapshot content
	const primaryKeyValues: any[] = [];
	for (const field of primaryKeyFields) {
		const value = (args.snapshot_content as any)[field];
		if (value === undefined || value === null) {
			throw new Error(
				`Primary key field '${field}' cannot be null or undefined`
			);
		}
		primaryKeyValues.push(value);
	}

	// Query existing state to check for duplicates
	let query = args.lix.db
		.selectFrom("state")
		.select("snapshot_content")
		.where("schema_key", "=", args.schema["x-lix-key"]);

	// Build WHERE conditions for each primary key field
	for (let i = 0; i < primaryKeyFields.length; i++) {
		const field = primaryKeyFields[i];
		const value = primaryKeyValues[i];
		// Use JSON extraction to check the field value in the content
		query = query.where(
			sql`json_extract(snapshot_content, '$.' || ${field})`,
			"=",
			value
		);
	}

	const existingStates = executeSync({ lix: args.lix, query });

	if (existingStates.length > 0) {
		const fieldNames = primaryKeyFields.join(", ");
		const fieldValues = primaryKeyValues.map(v => `'${v}'`).join(", ");
		
		throw new Error(
			`Primary key constraint violation: The primary key constraint on (${fieldNames}) is violated by values (${fieldValues})`
		);
	}
}

function validateUniqueConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: Snapshot["content"];
}): void {
	const uniqueConstraints = args.schema["x-lix-unique"];
	if (!uniqueConstraints || uniqueConstraints.length === 0) {
		return;
	}

	// Validate each unique constraint
	for (const uniqueFields of uniqueConstraints) {
		if (!uniqueFields || uniqueFields.length === 0) {
			continue;
		}

		// Extract values for this unique constraint
		const uniqueValues: any[] = [];
		for (const field of uniqueFields) {
			const value = (args.snapshot_content as any)[field];
			if (value === undefined || value === null) {
				// Skip unique constraint validation if any field is null/undefined
				// This allows nullable unique fields (like SQL UNIQUE constraints)
				continue;
			}
			uniqueValues.push(value);
		}

		// If we didn't get all values (some were null), skip this constraint
		if (uniqueValues.length !== uniqueFields.length) {
			continue;
		}

		// Query existing state to check for duplicates
		let query = args.lix.db
			.selectFrom("state")
			.select("snapshot_content")
			.where("schema_key", "=", args.schema["x-lix-key"]);

		// Build WHERE conditions for each field in the unique constraint
		for (let i = 0; i < uniqueFields.length; i++) {
			const field = uniqueFields[i];
			const value = uniqueValues[i];
			// Use JSON extraction to check the field value in the content
			query = query.where(
				sql`json_extract(snapshot_content, '$.' || ${field})`,
				"=",
				value
			);
		}

		const existingStates = executeSync({ lix: args.lix, query });

		if (existingStates.length > 0) {
			const fieldNames = uniqueFields.join(", ");
			const fieldValues = uniqueValues.map(v => `'${v}'`).join(", ");
			
			throw new Error(
				`Unique constraint violation: The unique constraint on (${fieldNames}) is violated by values (${fieldValues})`
			);
		}
	}
}

// Helper function to get nested value by path (e.g., 'foo.bar' from { foo: { bar: 'baz' } })
function getValueByPath(obj: any, path: string): any {
	if (!path) return obj;
	const parts = path.split('/').filter(part => part);
	let current = obj;
	for (const part of parts) {
		if (current === undefined || current === null) return undefined;
		current = current[part];
	}
	return current;
}

function validateForeignKeyConstraints(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	snapshot_content: Snapshot["content"];
}): void {
	const foreignKeys = args.schema["x-lix-foreign-keys"];
	if (!foreignKeys) {
		return;
	}

	// Validate each foreign key constraint
	for (const [localProperty, foreignKeyDef] of Object.entries(foreignKeys)) {
		const foreignKeyValue = (args.snapshot_content as any)[localProperty];
		
		// Skip validation if foreign key value is null or undefined
		// (like SQL foreign keys, null values are allowed)
		if (foreignKeyValue === null || foreignKeyValue === undefined) {
			continue;
		}

		// Build query to check if the referenced entity exists
		let query = args.lix.db
			.selectFrom("state")
			.select("snapshot_content")
			.where("schema_key", "=", foreignKeyDef.schemaKey);

		// Add version constraint if specified
		if (foreignKeyDef.schemaVersion) {
			// Get stored schema with specific version
			const referencedSchema = executeSync({
				lix: args.lix,
				query: args.lix.db
					.selectFrom("stored_schema")
					.select("value")
					.where(sql`json_extract(value, '$.["x-lix-key"]')`, "=", foreignKeyDef.schemaKey)
					.where(sql`json_extract(value, '$.["x-lix-version"]')`, "=", foreignKeyDef.schemaVersion)
			});

			if (referencedSchema.length === 0) {
				throw new Error(
					`Foreign key constraint violation: Referenced schema '${foreignKeyDef.schemaKey}' with version '${foreignKeyDef.schemaVersion}' does not exist`
				);
			}
		}

		// Use JSON extraction to check if the referenced property value matches
		query = query.where(
			sql`json_extract(snapshot_content, '$.' || ${foreignKeyDef.property})`,
			"=",
			foreignKeyValue
		);

		const referencedStates = executeSync({ lix: args.lix, query });

		if (referencedStates.length === 0) {
			throw new Error(
				`Foreign key constraint violation: The foreign key constraint on '${localProperty}' references '${foreignKeyDef.schemaKey}.${foreignKeyDef.property}' but no matching record exists with value '${foreignKeyValue}'`
			);
		}
	}
}
