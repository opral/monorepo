import { LixSchemaViewMap } from "../database/schema-view-map.js";
import { isJsonType } from "../schema-definition/json-type.js";

export function buildJsonColumnConfig(args?: {
	includeChangeView?: boolean;
}): Record<string, Record<string, { type: any }>> {
	const includeChangeView = args?.includeChangeView ?? true;
	const result: Record<string, Record<string, { type: any }>> = {};

	const hardcoded: Record<string, Record<string, { type: any }>> = {
		state: {
			snapshot_content: { type: "object" },
			metadata: { type: "object" },
		},
		state_all: {
			snapshot_content: { type: "object" },
			metadata: { type: "object" },
		},
		state_history: {
			snapshot_content: { type: "object" },
			metadata: { type: "object" },
		},
	};

	if (includeChangeView) {
		hardcoded.change = {
			snapshot_content: { type: "object" },
			metadata: { type: "object" },
		};
	}

	Object.assign(result, hardcoded);

	for (const [viewName, schema] of Object.entries(LixSchemaViewMap)) {
		if (typeof schema === "boolean" || !schema.properties) continue;
		const jsonColumns: Record<string, { type: any }> = {};
		for (const [key, def] of Object.entries(schema.properties)) {
			if (isJsonType(def)) {
				jsonColumns[key] = {
					type: ["string", "number", "boolean", "object", "array", "null"],
				};
			}
		}

		// All entity views expose lixcol_metadata as a JSON column sourced from change metadata.
		jsonColumns.lixcol_metadata = { type: "object" };
		if (Object.keys(jsonColumns).length > 0) {
			result[viewName] = jsonColumns;
			result[viewName + "_all"] = jsonColumns;
			result[viewName + "_history"] = jsonColumns;
		}
	}

	return result;
}
