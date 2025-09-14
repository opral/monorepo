import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import { nanoIdSync } from "../engine/deterministic/index.js";
import type { LixEngine } from "../engine/boot.js";

export function applyLogDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	const { engine } = args;
	// Create both primary and _all views for log
	createEntityViewsIfNotExists({
		engine: engine,
		schema: LixLogSchema,
		overrideName: "log",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: { id: () => nanoIdSync({ engine: engine }) },
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

// Pure business logic type (engine/selectable type)
export type LixLog = FromLixSchemaDefinition<typeof LixLogSchema>;
