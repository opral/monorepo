import type { LixEngine } from "./boot.js";

export function createExecuteSync(args: {
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "hooks"
		| "runtimeCacheRef"
		| "preprocessQuery"
		| "preprocessQueryV4"
	>;
}): LixEngine["executeSync"] {
	const executeSyncFn: LixEngine["executeSync"] = (args2) => {
		const preprocessed = args2.skipPreprocessing
			? { sql: args2.sql, parameters: args2.parameters, expandedSql: undefined }
			: args.engine.preprocessQuery({
					sql: args2.sql,
					parameters: (args2.parameters as ReadonlyArray<unknown>) ?? [],
				});

		// const preprocessed = {
		// 	sql: args2.sql,
		// 	parameters: (args2.parameters as ReadonlyArray<unknown>) ?? [],
		// };

		// const preprocessedV4 = preprocessed;
		const preprocessedV4 = args2.skipPreprocessing
			? {
					sql: preprocessed.sql,
					parameters: preprocessed.parameters ?? [],
					trace: true,
				}
			: args.engine.preprocessQueryV4({
					sql: preprocessed.sql,
					parameters: preprocessed.parameters ?? [],
					trace: true,
				});

		const columnNames: string[] = [];
		try {
			const rows = args.engine.sqlite.exec({
				sql: preprocessedV4.sql,
				bind: preprocessedV4.parameters as any[],
				returnValue: "resultRows",
				rowMode: "object",
				columnNames,
			});
			return { rows };
		} catch (error) {
			const enriched =
				error instanceof Error ? error : new Error(String(error));
			const debugPayload = {
				originalSql: args2.sql,
				rewrittenSql: preprocessedV4.sql,
				parameters: preprocessedV4.parameters,
			};
			Object.assign(enriched, debugPayload);
			throw enriched;
		}
	};

	return executeSyncFn;
}
