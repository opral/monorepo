import type { Kysely } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Snapshot } from "../snapshot/schema.js";
import { Ajv } from "ajv";
import { LixSchemaDefinition } from "./definition.js";

const ajv = new Ajv({
	strict: true,
	// allow 'x-*' properties in alignment with new json schema spec
	// https://json-schema.org/blog/posts/stable-json-schema
	strictSchema: false,
});
const validateLixSchema = ajv.compile(LixSchemaDefinition);

export function handleSchemaValidation(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>,
	schema: LixSchemaDefinition,
	snapshot_content: Snapshot["content"]
): void {
	const isValidLixSchema = validateLixSchema(schema);

	if (!isValidLixSchema) {
		throw new Error("The provided schema is not a valid lix schema.");
	}

	const isValidSnapshotContent = ajv.validate(schema, snapshot_content);

	if (!isValidSnapshotContent) {
		throw new Error("The provided snapshot content does not match the schema.");
	}
}
