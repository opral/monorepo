import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoId } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";

export function applyLabelDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db">
): void {
	createEntityViewsIfNotExists({
		lix,
		schema: LixLabelSchema,
		overrideName: "label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoId({ lix }) },
	});
}

export const LixLabelSchema = {
	"x-lix-key": "lix_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string", "x-lix-generated": true },
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixLabelSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixLabel = FromLixSchemaDefinition<typeof LixLabelSchema>;
