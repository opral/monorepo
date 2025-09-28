import type { LixEngine } from "./boot.js";
import { createQueryPreprocessor } from "./query-preprocessor/create-query-preprocessor.js";
import { createInternalStateReaderPreprocessor } from "./query-preprocessor/internal-state-reader.js";

type ExecuteSyncFn = (args: {
	sql: string;
	parameters?: Readonly<unknown[]>;
}) => { rows: any[] };

export async function createExecuteSync(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks" | "runtimeCacheRef">;
}): Promise<ExecuteSyncFn> {
	const preprocess = await createQueryPreprocessor(args.engine, [
		createInternalStateReaderPreprocessor,
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
