import { type KyselyPlugin } from "kysely";
import { createInMemoryDatabase } from "sqlite-wasm-kysely";

export async function ParseJsonBPluginV1(
	jsonbColumns: Record<string, string[]>,
): Promise<KyselyPlugin> {
	const jsonColumnNames = Object.keys(jsonbColumns).flatMap(
		(key) => jsonbColumns[key]!,
	);

	const sqlite = await createInMemoryDatabase({});

	return {
		transformResult: async (args) => {
			for (const row of args.result.rows) {
				for (const col of jsonColumnNames) {
					if (!row[col]) {
						// result does not have a whitelisted json column
						// ! this is a heursitic. ideally, we invest into
						// ! building ParseJsonBPluginV2 that detects
						// ! json columns from the query itself
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
