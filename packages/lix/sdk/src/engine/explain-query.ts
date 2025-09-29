import type { LixEngine } from "./boot.js";
import {
	rewriteSql,
	initializeSqlRewriter,
	buildSqlRewriteContext,
} from "./query-preprocessor/sql-rewriter.js";

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
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}): Promise<
	(args: { query: { sql: string; parameters: any[] } }) => ExplainQueryStage
> {
	await initializeSqlRewriter({ engine: args.engine });

	return ({ query }) => {
		const parameters = [...(query.parameters ?? [])];
		const contextJson = buildSqlRewriteContext({
			engine: args.engine,
			parameters,
		});
		const { sql: rewrittenSql, expandedSql } = rewriteSql(
			query.sql,
			contextJson
		);
		const explainRows = args.engine.sqlite.exec({
			sql: `EXPLAIN QUERY PLAN ${rewrittenSql}`,
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		}) as any[];

		const wasRewritten = rewrittenSql !== query.sql;

		return {
			original: {
				sql: query.sql,
				parameters,
			},
			expanded: expandedSql
				? {
						sql: expandedSql,
						parameters,
					}
				: undefined,
			rewritten: wasRewritten
				? {
						sql: rewrittenSql,
						parameters,
					}
				: undefined,
			plan: explainRows,
		};
	};
}
