import type { LixEngine } from "../engine/boot.js";
import { applyEntityLabelDatabaseSchema } from "./label/schema.js";

export function applyEntityDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "executeQuerySync" | "executeSync">;
}): void {
	applyEntityLabelDatabaseSchema(args);
}

// Entity type with canonical column names (used in regular tables like state, entity_label)
export type LixEntityCanonical = {
	schema_key: string;
	file_id: string;
	entity_id: string;
};

// Entity type with lixcol_ prefixed columns (used in entity views)
export type LixEntity = {
	lixcol_schema_key: string;
	lixcol_file_id: string;
	lixcol_entity_id: string;
};
