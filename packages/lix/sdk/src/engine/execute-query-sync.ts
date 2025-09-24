import type { CompiledQuery } from "kysely";
import type { LixEngine } from "./boot.js";
import { createQueryPreprocessor } from "./query-preprocessor/index.js";

export function createExecuteQuerySync(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}) {
	const { engine } = args;
	const preprocessQuery = createQueryPreprocessor({ engine });

	return (query: CompiledQuery<unknown>): { rows: any[] } => {
		const compiled = preprocessQuery({ query });

		const columnNames: string[] = [];
		const rows = engine.sqlite.exec({
			sql: compiled.sql,
			bind: compiled.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames,
		});
		return { rows };
	};
}
