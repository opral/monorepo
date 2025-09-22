import type { CompiledQuery } from "kysely";

import type { LixEngine } from "./boot.js";
import { createQueryCompiler } from "./query-compiler/index.js";

export function createExplainQuery(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}) {
	const compileWithPlugins = createQueryCompiler({ engine: args.engine });

	return ({
		query,
	}: {
		query: CompiledQuery<unknown>;
	}): {
		original: {
			sql: string;
			parameters: unknown[];
		};
		compiled: {
			sql: string;
			parameters: unknown[];
		};
		plan: any[];
	} => {
		const rewritten = compileWithPlugins({ query });
		const explain = args.engine.executeSync({
			sql: `EXPLAIN QUERY PLAN ${rewritten.sql}`,
			parameters: rewritten.parameters,
		});
		return {
			original: {
				sql: query.sql,
				parameters: [...(query.parameters ?? [])],
			},
			compiled: {
				sql: rewritten.sql,
				parameters: [...(rewritten.parameters ?? [])],
			},
			plan: explain.rows,
		};
	};
}
