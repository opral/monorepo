import type { LixEngine } from "./boot.js";
import { createQueryPreprocessorV2 } from "./query-preprocessor/create-query-preprocessor-v2.js";

type ExecuteSyncFn = (args: {
	sql: string;
	parameters?: Readonly<unknown[]>;
}) => { rows: any[] };

export async function createExecuteSync(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks" | "runtimeCacheRef">;
}): Promise<ExecuteSyncFn> {
	const preprocessorEngine = {
		...args.engine,
		executeSync: ({
			sql,
			parameters,
		}: {
			sql: string;
			parameters?: Readonly<unknown[]>;
		}) => {
			const columnNames: string[] = [];
			const rows = args.engine.sqlite.exec({
				sql,
				bind: (parameters as any[]) ?? [],
				returnValue: "resultRows",
				rowMode: "object",
				columnNames,
			});
			return { rows };
		},
	} as const;

	const preprocess = await createQueryPreprocessorV2(preprocessorEngine);

	const executeSyncFn: ExecuteSyncFn = (args2: {
		sql: string;
		parameters?: Readonly<unknown[]>;
	}) => {
		const preprocessed = preprocess({
			sql: args2.sql,
			parameters: args2.parameters ?? [],
		});
		const columnNames: string[] = [];
		try {
			const rows = args.engine.sqlite.exec({
				sql: preprocessed.sql,
				bind: preprocessed.parameters as any[],
				returnValue: "resultRows",
				rowMode: "object",
				columnNames,
			});
			return { rows };
		} catch (error) {
			const enriched =
				error instanceof Error ? error : new Error(String(error));
			const debugPayload = {
				rewrittenSql: preprocessed.sql,
				expandedSql: preprocessed.expandedSql,
				originalSql: args2.sql,
			};
			Object.assign(enriched, debugPayload);
			throw enriched;
		}
	};
	return executeSyncFn;
}
