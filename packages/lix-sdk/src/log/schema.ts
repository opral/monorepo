import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoId } from "../deterministic/index.js";
import type { Lix } from "../lix/open-lix.js";

export function applyLogDatabaseSchema(lix: Pick<Lix, "sqlite" | "db">): void {
	// Create both primary and _all views for log
	createEntityViewsIfNotExists({
		lix,
		schema: LixLogSchema,
		overrideName: "log",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoId({ lix }) },
	});
}

export const LixLogSchema = {
	"x-lix-key": "lix_log",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: {
			type: "string",
			description: "The unique identifier of the log entry",
			"x-lix-generated": true,
		},
		key: {
			type: "string",
			description: "The key of the log entry",
		},
		message: {
			type: "string",
			description: "The message of the log entry",
		},
		level: {
			type: "string",
			description: "The level of the log entry",
		},
	},
	required: ["id", "key", "message", "level"],
	additionalProperties: false,
} as const;
LixLogSchema satisfies LixSchemaDefinition;

// Pure business logic type (runtime/selectable type)
export type LixLog = FromLixSchemaDefinition<typeof LixLogSchema>;
