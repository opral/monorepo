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
					const raw = row[col];
					// Only parse binary JSONB blobs
					if (!(raw instanceof Uint8Array)) {
						continue;
					}
					try {
						// sqlite has its own jsonb format
						// hence, need to query sqlite to convert
						const json = sqlite.exec("SELECT json(?)", {
							bind: [raw],
							returnValue: "resultRows",
						})[0]![0];

						row[col] = JSON.parse(json as string);
					} catch {
						continue;
					}
				}
			}

			return args.result;
		},
		transformQuery: (args) => args.node,
	};
}
