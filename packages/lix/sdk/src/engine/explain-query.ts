import type { CompiledQuery } from "kysely";

import type { LixEngine } from "./boot.js";
import { createQueryPreprocessor } from "./query-middleware/index.js";
import { rewriteSql } from "./query-middleware/sql-rewriter/index.js";

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
		const rewritten = rewriteSql(query.sql);
		const explain = args.engine.executeSync({
			sql: `EXPLAIN QUERY PLAN ${rewritten}`,
		});
		return {
			original: {
				sql: query.sql,
				parameters: [...(query.parameters ?? [])],
			},
			rewritten: {
				sql: rewritten,
				parameters: [...(query.parameters ?? [])],
			},
			plan: explain.rows,
		};
	};
}
