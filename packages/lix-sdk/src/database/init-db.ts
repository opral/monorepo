import { Kysely } from "kysely";
import { createDialect, type SqliteDatabase } from "sqlite-wasm-kysely";
import { v7 as uuid_v7, v4 as uuid_v4 } from "uuid";
import type { LixDatabaseSchema } from "./schema.js";
import { applySchema } from "./apply-schema.js";
import { validateFilePath } from "../file/validate-file-path.js";
import { jsonSha256 } from "../snapshot/json-sha-256.js";
import { ParseJsonBPluginV1 } from "./kysely-plugin/parse-jsonb-plugin-v1.js";
import { SerializeJsonBPlugin } from "./kysely-plugin/serialize-jsonb-plugin.js";

export function initDb(args: {
	sqlite: SqliteDatabase;
}): Kysely<LixDatabaseSchema> {
	initFunctions({ sqlite: args.sqlite });
	applySchema({ sqlite: args.sqlite });
	const db = new Kysely<LixDatabaseSchema>({
		dialect: createDialect({
			database: args.sqlite,
		}),
		plugins: [
			ParseJsonBPluginV1({
				// jsonb columns
				file: ["metadata"],
				change_queue: ["metadata_before", "metadata_after"],
				snapshot: ["content"],
			}),
			SerializeJsonBPlugin(),
		],
	});
	return db;
}

function initFunctions(args: { sqlite: SqliteDatabase }) {
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
		name: "json_sha256",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			if (!value) {
				return "no-content";
			}

			const json = args.sqlite.exec("SELECT json(?)", {
				bind: [value],
				returnValue: "resultRows",
			})[0]![0];

			const parsed = JSON.parse(json as string);

			return jsonSha256(parsed);
		},
		deterministic: true,
	});

	args.sqlite.createFunction({
		name: "is_valid_file_path",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			return validateFilePath(value as string) as unknown as string;
		},
		deterministic: true,
	});
}
