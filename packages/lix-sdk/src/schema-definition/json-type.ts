export type JSONType =
	| string
	| number
	| boolean
	| null
	| JSONType[]
	| { [key: string]: JSONType };

/**
 * JSON schema definition for JSON values (object or array).
 */
export const JSONTypeSchema: Record<string, any> = {
	anyOf: [
		{ type: "object" },
		{ type: "array" },
		{ type: "string" },
		{ type: "number" },
		{ type: "boolean" },
		{ type: "null" },
	],
};

/**
 * Determines if a JSON schema property definition allows JSON values (object or array).
 *
 * Returns true if the definition's `type` is "object" or "array" (including arrays of types),
 * or if any `anyOf` subschemas specify `type: "object"` or `type: "array"`.
 * Used to identify columns that should be treated as JSON in the database layer.
 */
export function isJsonType(def: any): boolean {
	// Handles type: "object" or "array", or anyOf: [{type:...}]
	if (def.type) {
		const types = Array.isArray(def.type) ? def.type : [def.type];
		if (types.includes("object") || types.includes("array")) return true;
	}
	if (Array.isArray(def.anyOf)) {
		if (
			def.anyOf.some(
				(sub: any) => sub.type === "object" || sub.type === "array"
			)
		)
			return true;
	}
	return false;
}
