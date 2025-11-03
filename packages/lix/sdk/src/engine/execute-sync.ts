import type { LixEngine } from "./boot.js";

export function createExecuteSync(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "preprocessQuery"
	>;
}): LixEngine["executeSync"] {
	const executeSyncFn: LixEngine["executeSync"] = (args2) => {
		const mode = args2.preprocessMode ?? "full";
		const preprocessed =
			mode === "none"
				? {
						sql: args2.sql,
						parameters: (args2.parameters as ReadonlyArray<unknown>) ?? [],
					}
				: args.engine.preprocessQuery({
						sql: args2.sql,
						parameters: (args2.parameters as ReadonlyArray<unknown>) ?? [],
						mode,
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
				originalSql: args2.sql,
				parameters: preprocessed.parameters,
			};
			Object.assign(enriched, debugPayload);
			throw enriched;
		}
	};

	return executeSyncFn;
}
