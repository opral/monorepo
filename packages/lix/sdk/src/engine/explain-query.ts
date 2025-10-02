import type { LixEngine } from "./boot.js";

type ExplainQueryStage = {
	original: {
		sql: string;
		parameters: unknown[];
	};
	expanded?: {
		sql: string;
		parameters: unknown[];
	};
	rewritten?: {
		sql: string;
		parameters: unknown[];
	};
	plan: any[];
};

export async function createExplainQuery(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "preprocessQuery"
	>;
}): Promise<
	(args: { query: { sql: string; parameters: any[] } }) => ExplainQueryStage
> {
	const preprocess = args.engine.preprocessQuery;

	return ({ query }) => {
		const parameters = [...(query.parameters ?? [])];
		const result = preprocess({
			sql: query.sql,
			parameters,
			sideEffects: false,
		});

		const explainRows = args.engine.sqlite.exec({
			sql: `EXPLAIN QUERY PLAN ${result.sql}`,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		}) as any[];

		const wasRewritten = result.sql !== query.sql;

		return {
			original: {
				sql: query.sql,
				parameters,
			},
			expanded: result.expandedSql
				? {
						sql: result.expandedSql,
						parameters,
					}
				: undefined,
			rewritten: wasRewritten
				? {
						sql: result.sql,
						parameters: [...result.parameters],
					}
				: undefined,
			plan: explainRows,
		};
	};
}
