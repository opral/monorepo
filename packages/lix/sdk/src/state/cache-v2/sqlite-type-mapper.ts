import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

export type JsonPropertyDefinition = Record<string, unknown>;

export function mapSchemaPropertyToSqliteType(
	definition: JsonPropertyDefinition | undefined
): string {
	if (!definition || typeof definition !== "object") {
		return "ANY";
	}

	const primaryType = extractPrimaryType(definition);
	switch (primaryType) {
		case "integer":
			return "INTEGER";
		case "number":
			return "REAL";
		case "boolean":
			return "INTEGER";
		case "string":
			return "TEXT";
		case "array":
		case "object":
			return "TEXT";
		default:
			return "ANY";
	}
}

export function extractPrimaryType(
	definition: JsonPropertyDefinition | undefined
): string | null {
	if (!definition || typeof definition !== "object") {
		return null;
	}

	const rawType = definition.type;
	if (typeof rawType === "string") {
		return rawType;
	}

	if (Array.isArray(rawType)) {
		for (const type of rawType) {
			if (typeof type === "string" && type.toLowerCase() !== "null") {
				return type;
			}
		}
	}

	return null;
}

export function extractPropertySchema(
	schema: LixSchemaDefinition | null | undefined,
	property: string
): JsonPropertyDefinition | undefined {
	if (!schema || typeof schema !== "object") return undefined;
	const properties = schema.properties;
	if (!properties || typeof properties !== "object") return undefined;
	const definition = (properties as Record<string, unknown>)[property];
	return typeof definition === "object"
		? (definition as JsonPropertyDefinition)
		: undefined;
}
