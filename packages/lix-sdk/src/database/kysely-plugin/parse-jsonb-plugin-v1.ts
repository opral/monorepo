import { type KyselyPlugin } from "kysely";
import {
	createInMemoryDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";

// workaround for v1. v2 doesn't need to transform
// jsonb columns during runtime
let sqlite: SqliteWasmDatabase;

export function ParseJsonBPluginV1(
	jsonbColumns: Record<string, string[]>
): KyselyPlugin {
	const jsonColumnNames = Object.keys(jsonbColumns).flatMap(
		(key) => jsonbColumns[key]!
	);

	return {
		transformResult: async (args) => {
			if (!sqlite) {
				sqlite = await createInMemoryDatabase({});
			}

			for (const row of args.result.rows) {
				for (const col of jsonColumnNames) {
					if (!row[col]) {
						// result does not have a whitelisted json column
						// ! this is a heursitic. ideally, we invest into
						// ! building ParseJsonBPluginV2 that detects
						// ! json columns from the query itself
						// see https://github.com/opral/lix-sdk/issues/145
						continue;
					}
					try {
						// sqlite has it's own jsonb format
						// hence, need to query sqlite to convert
						// to json
						const json = sqlite.exec("SELECT json(?)", {
							bind: [row[col] as Uint8Array],
							returnValue: "resultRows",
						})[0]![0];

						row[col] = JSON.parse(json as string);
					} catch {
						// it's not a json binary
						continue;
					}
				}
			}

			return args.result;
		},
		transformQuery: (args) => args.node,
	};
}
