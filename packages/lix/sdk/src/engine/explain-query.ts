import type { CompiledQuery } from "kysely";

import type { LixEngine } from "./boot.js";
import { createQueryPreprocessor } from "./query-preprocessor/index.js";

export function createExplainQuery(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}) {
	const preprocessQuery = createQueryPreprocessor({ engine: args.engine });

	return ({
		query,
	}: {
		query: CompiledQuery<unknown>;
	}): {
		original: {
			sql: string;
			parameters: unknown[];
		};
		rewritten: {
			sql: string;
			parameters: unknown[];
		};
		plan: any[];
	} => {
		const rewritten = preprocessQuery({ query });
		const explain = args.engine.executeSync({
			sql: `EXPLAIN QUERY PLAN ${rewritten.sql}`,
			parameters: rewritten.parameters,
		});
		return {
			original: {
				sql: query.sql,
				parameters: [...(query.parameters ?? [])],
			},
			rewritten: {
				sql: rewritten.sql,
				parameters: [...(rewritten.parameters ?? [])],
			},
			plan: explain.rows,
		};
	};
}
