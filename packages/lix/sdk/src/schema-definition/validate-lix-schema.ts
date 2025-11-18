import { Ajv } from "ajv";
import { parse } from "@marcbachmann/cel-js";
import { LixSchemaDefinition } from "./definition.js";
import { parseJsonPointer } from "./json-pointer.js";

const ajv = new Ajv({
	strict: true,
	// allow 'x-*' properties in alignment with new json schema spec
	// https://json-schema.org/blog/posts/stable-json-schema
	strictSchema: false,
});
ajv.addFormat("json-pointer", {
	type: "string",
	validate: (value: string) => {
		try {
			parseJsonPointer(value);
			return true;
		} catch {
			return false;
		}
	},
});
ajv.addFormat("cel", {
	type: "string",
	validate: (value: string) => {
		try {
			parse(value);
			return true;
		} catch {
			return false;
		}
	},
});

const _validateLixSchemaDefinition = ajv.compile(LixSchemaDefinition);

function assertPrimaryKeyPointers(schema: LixSchemaDefinition) {
	const primaryKey = (schema as any)["x-lix-primary-key"];
	if (!Array.isArray(primaryKey)) return;
	for (const pointer of primaryKey) {
		if (typeof pointer !== "string") continue;
		const segments = parseJsonPointer(pointer);
		if (!segments.length || !schemaHasProperty(schema, segments)) {
			throw new Error(
				`Invalid Lix schema definition: x-lix-primary-key references missing property "${pointer}".`
			);
		}
	}
}

function assertUniquePointers(schema: LixSchemaDefinition) {
	const uniqueGroups = (schema as any)["x-lix-unique"];
	if (!Array.isArray(uniqueGroups)) return;
	for (const group of uniqueGroups) {
		if (!Array.isArray(group)) continue;
		for (const pointer of group) {
			if (typeof pointer !== "string") continue;
			const segments = parseJsonPointer(pointer);
			if (!segments.length || !schemaHasProperty(schema, segments)) {
				throw new Error(
					`Invalid Lix schema definition: x-lix-unique references missing property "${pointer}".`
				);
			}
		}
	}
}

function schemaHasProperty(current: any, segments: readonly string[]): boolean {
	let node: any = current;
	for (const segment of segments) {
		if (!node || typeof node !== "object") return false;
		const props = (node as any).properties;
		if (!props || typeof props !== "object" || !(segment in props)) {
			return false;
		}
		node = (props as any)[segment];
	}
	return true;
}

/**
 * Validates that a schema conforms to the LixSchemaDefinition format
 * and then validates data against that schema.
 *
 * @param schema - The Lix schema definition to validate against
 * @param data - The data to validate
 * @returns true if both the schema and data are valid
 * @throws Error with validation details if either validation fails
 *
 * @example
 * ```typescript
 * const userSchema = {
 *   "x-lix-key": "user",
 *   "x-lix-version": "1.0",
 *   type: "object",
 *   properties: {
 *     id: { type: "string" },
 *     name: { type: "string" },
 *     age: { type: "number" }
 *   },
 *   required: ["id", "name"]
 * } as const satisfies LixSchemaDefinition;
 *
 * const userData = {
 *   id: "123",
 *   name: "John Doe",
 *   age: 30
 * };
 *
 * try {
 *   validateLixSchema(userSchema, userData); // returns true
 * } catch (error) {
 *   console.error("Validation failed:", error);
 * }
 * ```
 */
export function validateLixSchema(schema: unknown, data: unknown): boolean {
	// First validate that the schema itself is valid
	const schemaValid = _validateLixSchemaDefinition(schema);
	if (!schemaValid) {
		throw new Error(
			`Invalid Lix schema definition: ${JSON.stringify(_validateLixSchemaDefinition.errors, null, 2)}`
		);
	}
	assertPrimaryKeyPointers(schema as LixSchemaDefinition);
	assertUniquePointers(schema as LixSchemaDefinition);

	// Then validate the data against the schema
	const dataValidator = ajv.compile(schema as LixSchemaDefinition);
	const dataValid = dataValidator(data);
	if (!dataValid) {
		throw new Error(
			`Data validation failed: ${JSON.stringify(dataValidator.errors, null, 2)}`
		);
	}

	return true;
}

/**
 * Validates only the Lix schema definition format.
 * Use this when you only need to check if a schema is valid.
 *
 * @param schema - The schema to validate
 * @returns true if the schema is valid
 * @throws Error with validation details if validation fails
 *
 * @example
 * ```typescript
 * const schema = {
 *   "x-lix-key": "product",
 *   "x-lix-version": "1.0",
 *   type: "object",
 *   properties: {
 *     id: { type: "string" }
 *   }
 * };
 *
 * try {
 *   validateLixSchemaDefinition(schema); // returns true
 * } catch (error) {
 *   console.error("Invalid schema:", error);
 * }
 * ```
 */
export function validateLixSchemaDefinition(schema: unknown): boolean {
	const valid = _validateLixSchemaDefinition(schema);
	if (!valid) {
		throw new Error(
			`Invalid Lix schema definition: ${JSON.stringify(_validateLixSchemaDefinition.errors, null, 2)}`
		);
	}
	assertPrimaryKeyPointers(schema as LixSchemaDefinition);
	assertUniquePointers(schema as LixSchemaDefinition);
	return valid;
}
