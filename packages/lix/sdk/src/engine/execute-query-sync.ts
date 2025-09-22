import type { CompiledQuery } from "kysely";
import type { LixEngine } from "./boot.js";
import { createQueryCompiler } from "./query-compiler/index.js";

export function createExecuteQuerySync(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}) {
	const { engine } = args;
	const compile = createQueryCompiler({ engine });

	return ({ query }: { query: CompiledQuery<unknown> }): { rows: any[] } => {
		const compiled = compile({ query });

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
