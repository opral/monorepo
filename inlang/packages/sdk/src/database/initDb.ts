import { Kysely } from "kysely";
import { type InlangDatabaseSchema } from "./schema.js";
import { JsonPlugin } from "./jsonPlugin.js";
import { type Lix } from "@lix-js/sdk";
import { createBundleView } from "../schema-definitions/bundle.js";
import { createMessageView } from "../schema-definitions/message.js";
import { createVariantView } from "../schema-definitions/variant.js";

const INLANG_PLUGIN_KEY = "inlang_sdk";
const INLANG_FILE_ID = "inlang";

export function initDb(lix: Lix): Kysely<InlangDatabaseSchema> {
	const engine = lix.engine;
	if (engine === undefined) {
		throw new Error(
			"Lix engine is not available. initDb requires an in-process Lix engine to register entity views."
		);
	}

	engine.sqlite.exec("PRAGMA foreign_keys = ON");

	createBundleView({
		engine,
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
	});
	createMessageView({
		engine,
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
	});
	createVariantView({
		engine,
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
	});

	return lix.db
		.withPlugin(new JsonPlugin({ engine }))
		.withTables<InlangDatabaseSchema>() as unknown as Kysely<InlangDatabaseSchema>;
}
