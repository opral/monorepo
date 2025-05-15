import { Ajv } from "ajv";
import { LixSchemaDefinition } from "../schema/definition.js";
import type { Lix } from "../lix/open-lix.js";
import type { Snapshot } from "../snapshot/schema.js";

const ajv = new Ajv({
	strict: true,
	// allow 'x-*' properties in alignment with new json schema spec
	// https://json-schema.org/blog/posts/stable-json-schema
	strictSchema: false,
});
const validateLixSchema = ajv.compile(LixSchemaDefinition);

export function validateSnapshotContent(args: {
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
		throw new Error(
			`The provided snapshot content does not match the schema: ${ajv.errorsText(ajv.errors)}`
		);
	}
}
