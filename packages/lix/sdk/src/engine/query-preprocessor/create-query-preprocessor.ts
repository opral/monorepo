import type { LixEngine } from "../boot.js";
import { rewriteSql } from "./sql-rewriter/rewrite-sql.js";
import type {
	QueryPreprocessorFn,
	QueryPreprocessorResult,
} from "./create-query-preprocessor-v2.js";

export type QueryPreprocessor = (args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "runtimeCacheRef" | "hooks" | "executeSync"
	>;
}) => Promise<QueryPreprocessorFn>;

/**
 * Legacy helper that composes multiple preprocessor stages.
 */
export async function createQueryPreprocessor(
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>,
	preprocessors: QueryPreprocessor[]
): Promise<QueryPreprocessorFn> {
	const stages: QueryPreprocessorFn[] = [];
	for (const buildPreprocessor of preprocessors) {
		const stage = await buildPreprocessor({ engine });
		stages.push(stage);
	}

	return ({
		sql,
		parameters,
		sideEffects,
	}: {
		sql: string;
		parameters: ReadonlyArray<unknown>;
		sideEffects?: boolean;
	}): QueryPreprocessorResult => {
		let context: QueryPreprocessorResult = {
			sql: rewriteSql(sql),
			parameters,
		};

		for (const stage of stages) {
			const next = stage({
				sql: context.sql,
				parameters: context.parameters,
				sideEffects,
			});
			context = {
				sql: next.sql,
				parameters: next.parameters,
				expandedSql: next.expandedSql ?? context.expandedSql,
			};
		}

		return context;
	};
}
