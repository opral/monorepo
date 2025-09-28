import type { CompiledQuery } from "kysely";
import type { LixEngine } from "./boot.js";
import { rewriteSql } from "./query-preprocessor/sql-rewriter.js";

export async function createExplainQuery(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}): Promise<
	({ query }: { query: CompiledQuery<unknown> }) => {
		original: {
			sql: string;
			parameters: unknown[];
		};
		rewritten: {
			sql: string;
			parameters: unknown[];
		};
		plan: any[];
	}
> {
	return ({ query }) => {
		const { sql: rewrittenSql } = rewriteSql(query.sql);
		const explain = args.engine.executeSync({
			sql: `EXPLAIN QUERY PLAN ${rewrittenSql}`,
		});
		return {
			original: {
				sql: query.sql,
				parameters: [...(query.parameters ?? [])],
			},
			rewritten: {
				sql: rewrittenSql,
				parameters: [...(query.parameters ?? [])],
			},
			plan: explain.rows,
		};
	};
}
