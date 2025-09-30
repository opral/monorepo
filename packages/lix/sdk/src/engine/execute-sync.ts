import type { LixEngine } from "./boot.js";
import { createQueryPreprocessor } from "./query-preprocessor/create-query-preprocessor.js";
import { createInternalStateVtablePreprocessor } from "./query-preprocessor/internal-state-vtable.js";

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

	const preprocess = await createQueryPreprocessor(preprocessorEngine, [
		// createInternalStateVtablePreprocessor,
	]);

	const executeSyncFn: ExecuteSyncFn = (args2: {
		sql: string;
		parameters?: Readonly<unknown[]>;
	}) => {
		const preprocessed = preprocess({
			sql: args2.sql,
			parameters: args2.parameters ?? [],
		});
		const columnNames: string[] = [];
		const rows = args.engine.sqlite.exec({
			sql: preprocessed.sql,
			bind: preprocessed.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames,
		});
		return { rows };
	};
	return executeSyncFn;
}
