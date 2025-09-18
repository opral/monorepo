import {
	JSONTypeSchema,
	createEntityViewsIfNotExists,
	uuidV7Sync,
	type Lix,
	type LixSchemaDefinition,
} from "@lix-js/sdk";

export const InlangMessageSchema = {
	"x-lix-key": "inlang_message",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": [
		{
			properties: ["bundleId"],
			references: { schemaKey: "inlang_bundle", properties: ["id"] },
		},
	],
	type: "object",
	properties: {
		id: { type: "string" },
		bundleId: { type: "string" },
		locale: { type: "string" },
		selectors: JSONTypeSchema,
	},
	required: ["id", "bundleId", "locale", "selectors"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;

type Engine = NonNullable<Lix["engine"]>;

export function createMessageView(args: {
	engine: Engine;
	pluginKey: string;
	hardcodedFileId: string;
}) {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: InlangMessageSchema,
		overrideName: "message",
		pluginKey: args.pluginKey,
		hardcodedFileId: args.hardcodedFileId,
		defaultValues: {
			id: () => uuidV7Sync({ engine: args.engine }),
			selectors: () => JSON.stringify([]),
		},
	});
}
