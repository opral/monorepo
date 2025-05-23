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
			sql.raw(`json_extract(snapshot_content, '$.${field}')`),
			"=",
			value
		);
	}

	const existingStates = executeSync({ lix: args.lix, query });

	if (existingStates.length > 0) {
		const primaryKeyDescription =
			primaryKeyFields.length === 1
				? `Primary key '${primaryKeyFields[0]}'`
				: `Composite primary key [${primaryKeyFields.join(", ")}]`;

		const valueDescription =
			primaryKeyFields.length === 1
				? `'${primaryKeyValues[0]}'`
				: `[${primaryKeyValues.map((v) => `'${v}'`).join(", ")}]`;

		throw new Error(
			`Primary key constraint violation: ${primaryKeyDescription} with value ${valueDescription} already exists`
		);
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
