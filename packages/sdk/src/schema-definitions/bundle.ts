import {
	JSONTypeSchema,
	createEntityViewsIfNotExists,
	type Lix,
	type LixSchemaDefinition,
} from "@lix-js/sdk";
import { humanId } from "../human-id/human-id.js";

export const InlangBundleSchema = {
	"x-lix-key": "inlang_bundle",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		declarations: JSONTypeSchema,
	},
	required: ["id", "declarations"],
	additionalProperties: false,
} as const satisfies LixSchemaDefinition;

type Engine = NonNullable<Lix["engine"]>;

export function createBundleView(args: {
	engine: Engine;
	pluginKey: string;
	hardcodedFileId: string;
}) {
	createEntityViewsIfNotExists({
		engine: args.engine,
		schema: InlangBundleSchema,
		overrideName: "bundle",
		pluginKey: args.pluginKey,
		hardcodedFileId: args.hardcodedFileId,
		defaultValues: {
			id: () => humanId(),
			declarations: () => JSON.stringify([]),
		},
	});
}
