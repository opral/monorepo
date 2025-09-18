import { Kysely } from "kysely";
import { type InlangDatabaseSchema } from "./schema.js";
import { humanId } from "../human-id/human-id.js";
import { JsonbPlugin } from "./jsonbPlugin.js";
import {
	createEntityViewsIfNotExists,
	uuidV7Sync,
	type Lix,
} from "@lix-js/sdk";
import { InlangBundleSchema } from "../schema-definitions/bundle.js";
import { InlangMessageSchema } from "../schema-definitions/message.js";
import { InlangVariantSchema } from "../schema-definitions/variant.js";

const INLANG_PLUGIN_KEY = "inlang_sdk";
const INLANG_FILE_ID = "inlang";

export function initDb(lix: Lix): Kysely<InlangDatabaseSchema> {
	const engine = lix.engine;
	if (engine === undefined) {
		throw new Error(
			"Lix engine is not available. initDb requires an in-process Lix engine to register entity views."
		);
	}

	createEntityViewsIfNotExists({
		engine,
		schema: InlangBundleSchema,
		overrideName: "bundle",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => humanId(),
			declarations: () => JSON.stringify([]),
		},
	});

	createEntityViewsIfNotExists({
		engine,
		schema: InlangMessageSchema,
		overrideName: "message",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => uuidV7Sync({ engine }),
			selectors: () => JSON.stringify([]),
		},
	});

	createEntityViewsIfNotExists({
		engine,
		schema: InlangVariantSchema,
		overrideName: "variant",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => uuidV7Sync({ engine }),
			matches: () => JSON.stringify([]),
			pattern: () => JSON.stringify([]),
		},
	});

	return lix.db
		.withPlugin(new JsonbPlugin({ database: engine.sqlite }))
		.withTables<InlangDatabaseSchema>() as unknown as Kysely<InlangDatabaseSchema>;
}
