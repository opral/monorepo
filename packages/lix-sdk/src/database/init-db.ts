import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { createDialect, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { v7 as uuid_v7, v4 as uuid_v4 } from "uuid";
import type { LixDatabaseSchema } from "./schema.js";
import { applySchema } from "./apply-schema.js";
import { ParseJsonBPluginV1 } from "./kysely-plugin/parse-jsonb-plugin-v1.js";
import { SerializeJsonBPlugin } from "./kysely-plugin/serialize-jsonb-plugin.js";
import { humanId } from "human-id";
import { nanoid } from "./nano-id.js";

export function initDb(args: {
	sqlite: SqliteWasmDatabase;
}): Kysely<LixDatabaseSchema> {
	initFunctions({ sqlite: args.sqlite });
	const db = new Kysely<LixDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			new ParseJSONResultsPlugin(),
			ParseJsonBPluginV1({
				// jsonb columns
				file: ["metadata"],
				file_queue: ["metadata_before", "metadata_after"],
				snapshot: ["content"],
				thread: ["body"],
			}),
			SerializeJsonBPlugin(),
		],
	});

	applySchema({ sqlite: args.sqlite, db: db });
	return db;
}

function initFunctions(args: { sqlite: SqliteWasmDatabase }) {
	args.sqlite.createFunction({
		name: "uuid_v7",
		arity: 0,
		xFunc: () => uuid_v7(),
	});

	args.sqlite.createFunction({
		name: "uuid_v4",
		arity: 0,
		xFunc: () => uuid_v4(),
	});

	args.sqlite.createFunction({
		name: "human_id",
		arity: 0,
		xFunc: () => humanId({ separator: "-", capitalize: false }),
	});

	args.sqlite.createFunction({
		name: "nano_id",
		arity: -1,
		// @ts-expect-error - not sure why this is not working
		xFunc: (_ctx: number, length: number) => {
			return nanoid(length);
		},
	});
}
