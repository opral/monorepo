import type { JSONType } from "../snapshot/schema.js";
import { Ajv } from "ajv";
import { LixSchemaDefinition } from "./definition.js";
import type { Lix } from "../lix/open-lix.js";

const ajv = new Ajv({
	strict: true,
	// allow 'x-*' properties in alignment with new json schema spec
	// https://json-schema.org/blog/posts/stable-json-schema
	strictSchema: false,
});
const validateLixSchema = ajv.compile(LixSchemaDefinition);

export function validateSchema(args: {
	lix: Pick<Lix, "sqlite" | "db">;
	schema: LixSchemaDefinition;
	data: JSONType;
}): void {
	const isValidLixSchema = validateLixSchema(args.schema);

	if (!isValidLixSchema) {
		throw new Error(
			`The provided schema is not a valid lix schema: ${ajv.errorsText(validateLixSchema.errors)}`
		);
	}

	const isValidSnapshotContent = ajv.validate(args.schema, args.data);

	if (!isValidSnapshotContent) {
		throw new Error(
			`The provided snapshot content does not match the schema: ${ajv.errorsText(ajv.errors)}`
		);
	}
}
