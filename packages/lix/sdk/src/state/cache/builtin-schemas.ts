import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { LixSchemaViewMap } from "../../database/schema-view-map.js";
import {
	LixVersionDescriptorSchema,
	LixVersionTipSchema,
} from "../../version/schema-definition.js";

const registry = new Map<string, LixSchemaDefinition>();

function register(definition: LixSchemaDefinition): void {
	const key = definition["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		registry.set(key, definition);
	}
}

for (const definition of Object.values(LixSchemaViewMap)) {
	register(definition);
}

register(LixVersionDescriptorSchema);
register(LixVersionTipSchema);

export const BUILTIN_CACHE_SCHEMAS: Record<string, LixSchemaDefinition> =
	Object.fromEntries(registry);
