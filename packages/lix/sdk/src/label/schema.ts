import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoIdSync } from "../runtime/deterministic/index.js";
import type { LixRuntime } from "../runtime/boot.js";

export function applyLabelDatabaseSchema(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db" | "hooks">;
}): void {
	const { runtime } = args;
	createEntityViewsIfNotExists({
		runtime,
		schema: LixLabelSchema,
		overrideName: "label",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoIdSync({ runtime }) },
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
