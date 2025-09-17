import { CamelCasePlugin, Kysely } from "kysely";
import { applySchema, type InlangDatabaseSchema } from "./schema.js";
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

type InitDbArgs =
	| { lix: Lix }
	| { sqlite: SqliteWasmDatabase };

/**
 * Creates a Kysely instance that speaks the inlang schema.
 *
 * When a Lix instance is provided, the returned client reuses the shared
 * Lix connection so that every query flows through Lix' entity views. When a
 * standalone SQLite database is provided (legacy fallback), the schema is
 * created locally.
 *
 * @example
 * const projectDb = initDb({ lix });
 *
 * @example
 * const legacyDb = initDb({ sqlite });
 */
export function initDb(args: InitDbArgs): Kysely<InlangDatabaseSchema> {
	if ("lix" in args) {
		return initDbWithLix(args.lix);
	}
	return initDbWithSqlite(args.sqlite);
}

function initDbWithLix(lix: Lix): Kysely<InlangDatabaseSchema> {
	const engine = lix.engine;
	if (engine === undefined) {
		throw new Error(
			"Lix engine is not available. initDb requires an in-process Lix engine to register entity views."
		);
	}

	initDefaultValueFunctions({ sqlite: engine.sqlite });

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
			id: () => v7(),
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
			id: () => v7(),
			matches: () => JSON.stringify([]),
			pattern: () => JSON.stringify([]),
		},
	});

	return lix.db
		.withPlugin(new JsonbPlugin({ database: engine.sqlite }))
		.withTables<InlangDatabaseSchema>() as unknown as Kysely<InlangDatabaseSchema>;
}

function initDbWithSqlite(
	sqlite: SqliteWasmDatabase
): Kysely<InlangDatabaseSchema> {
	initDefaultValueFunctions({ sqlite });
	applySchema({ sqlite });

	return new Kysely<InlangDatabaseSchema>({
		dialect: createDialect({ database: sqlite }),
		plugins: [
			new CamelCasePlugin(),
			new JsonbPlugin({ database: sqlite }),
		],
	});
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
