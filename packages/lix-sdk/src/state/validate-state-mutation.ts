import { Ajv } from "ajv";
import type { Lix } from "../lix/open-lix.js";
import type { Snapshot } from "../snapshot/schema.js";
import { LixSchemaDefinition } from "../schema-definition/definition.js";

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
