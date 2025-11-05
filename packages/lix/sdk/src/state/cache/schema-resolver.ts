import type { LixEngine } from "../../engine/boot.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import {
	getStoredSchema,
	getAllStoredSchemas,
} from "../../stored-schema/get-stored-schema.js";
import { BUILTIN_CACHE_SCHEMAS } from "./builtin-schemas.js";

/**
 * Resolves a cache schema definition from stored state or built-in fallbacks.
 *
 * @example
 *
 * ```ts
 * const definition = resolveCacheSchemaDefinition({ engine, schemaKey: "lix_commit" });
 * if (definition) {
 *   console.log(definition["x-lix-version"]);
 * }
 * ```
 */
export function resolveCacheSchemaDefinition(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	schemaKey: string;
}): LixSchemaDefinition | null {
	const stored = getStoredSchema({ engine: args.engine, key: args.schemaKey });
	if (stored) {
		return stored;
	}
	return BUILTIN_CACHE_SCHEMAS[args.schemaKey] ?? null;
}

/**
 * Lists all cache schema definitions currently available to the engine.
 *
 * @example
 *
 * ```ts
 * const schemas = listAvailableCacheSchemas({ engine });
 * for (const [key] of schemas.entries()) {
 *   console.log(key);
 * }
 * ```
 */
export function listAvailableCacheSchemas(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
}): Map<string, LixSchemaDefinition> {
	const schemas = new Map<string, LixSchemaDefinition>();
	const { definitions } = getAllStoredSchemas({ engine: args.engine });
	for (const [schemaKey, definition] of definitions) {
		if (typeof schemaKey !== "string" || schemaKey.length === 0) continue;
		schemas.set(schemaKey, definition);
	}
	for (const [key, definition] of Object.entries(BUILTIN_CACHE_SCHEMAS)) {
		if (!schemas.has(key)) {
			schemas.set(key, definition);
		}
	}
	return schemas;
}
