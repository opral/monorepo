import { CamelCasePlugin, Kysely } from "kysely";
import { type InlangDatabaseSchema } from "./schema.js";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { v7 } from "uuid";
import { humanId } from "../human-id/human-id.js";
import { JsonbPlugin } from "./jsonbPlugin.js";
import { createEntityViewsIfNotExists, type Lix } from "@lix-js/sdk";
import { InlangBundleSchema } from "../schema-definitions/bundle.js";
import { InlangMessageSchema } from "../schema-definitions/message.js";
import { InlangVariantSchema } from "../schema-definitions/variant.js";

const INLANG_PLUGIN_KEY = "inlang_sdk";
const INLANG_FILE_ID = "inlang";

export function initDb(args: { lix: Lix }) {
	initDefaultValueFunctions({ sqlite: args.lix.engine!.sqlite });

	createEntityViewsIfNotExists({
		engine: args.lix.engine!,
		schema: InlangBundleSchema,
		overrideName: "bundle",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => humanId(),
		},
	});

	createEntityViewsIfNotExists({
		engine: args.lix.engine!,
		schema: InlangMessageSchema,
		overrideName: "message",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => v7(),
		},
	});

	createEntityViewsIfNotExists({
		engine: args.lix.engine!,
		schema: InlangVariantSchema,
		overrideName: "variant",
		pluginKey: INLANG_PLUGIN_KEY,
		hardcodedFileId: INLANG_FILE_ID,
		defaultValues: {
			id: () => v7(),
		},
	});

	const db = new Kysely<InlangDatabaseSchema>({
		dialect: createDialect({
			database: args.lix.engine!.sqlite,
		}),
		plugins: [
			new CamelCasePlugin(),
			new JsonbPlugin({ database: args.lix.engine!.sqlite }),
		],
	});
	return db;
}

function initDefaultValueFunctions(args: { sqlite: SqliteWasmDatabase }) {
	args.sqlite.createFunction({
		name: "uuid_v7",
		arity: 0,
		xFunc: () => v7(),
	});
	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () => humanId(),
	});
}
