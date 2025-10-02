import type { LixEngine } from "./boot.js";
import type { QueryPreprocessorFn } from "./query-preprocessor/create-query-preprocessor-v2.js";

type ExecuteSyncFn = (args: {
	sql: string;
	parameters?: Readonly<unknown[]>;
}) => { rows: any[] };

export async function createExecuteSync(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks" | "runtimeCacheRef">;
	preprocess: QueryPreprocessorFn;
}): Promise<ExecuteSyncFn> {
	const preprocess = args.preprocess;

	const executeSyncFn: ExecuteSyncFn = (args2: {
		sql: string;
		parameters?: Readonly<unknown[]>;
	}) => {
		const preprocessed = preprocess({
			sql: args2.sql,
			parameters: (args2.parameters as ReadonlyArray<unknown>) ?? [],
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
