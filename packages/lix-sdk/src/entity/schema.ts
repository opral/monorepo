import type { Lix } from "../lix/open-lix.js";
import { applyEntityLabelDatabaseSchema } from "./label/schema.js";

export function applyEntityDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db">
): void {
	applyEntityLabelDatabaseSchema(lix);
}

export type LixEntity = {
	schema_key: string;
	file_id: string;
	entity_id: string;
};
