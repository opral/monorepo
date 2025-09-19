import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { LixEngine } from "../engine/boot.js";
import { uuidV7Sync } from "../engine/deterministic/uuid-v7.js";

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
		defaultValues: { id: () => uuidV7Sync({ engine: engine }) },
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
			nullable: true,
		},
		payload: {
			...JSONTypeSchema,
			description: "Structured payload for the log entry",
		} as any,
		level: {
			type: "string",
			description: "The level of the log entry",
		},
	},
	required: ["id", "key", "level"],
	additionalProperties: false,
} as const;
LixLogSchema satisfies LixSchemaDefinition;

// Pure business logic type (engine/selectable type)
export type LixLog = FromLixSchemaDefinition<typeof LixLogSchema>;
