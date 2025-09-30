import type { LixEngine } from "../boot.js";
import { rewriteSql } from "./sql-rewriter/rewrite-sql.js";

export type QueryPreprocessorResult = {
	sql: string;
	parameters: ReadonlyArray<unknown>;
};

export type QueryPreprocessorStage = (args: {
	sql: string;
	parameters: ReadonlyArray<unknown>;
}) => QueryPreprocessorResult;

export type QueryPreprocessor = (args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "runtimeCacheRef" | "hooks" | "executeSync"
	>;
}) => Promise<QueryPreprocessorStage>;

/**
 * Creates a composed query preprocessor that applies each stage in order.
 *
 * Every preprocessor is built asynchronously exactly once and later executed
 * sequentially whenever the returned function is invoked.
 *
 * @example
 * const preprocess = await createQueryPreprocessor(engine, [builder]);
 * const result = preprocess({ sql: "SELECT 1", parameters: [] });
 * console.log(result.sql);
 */
export async function createQueryPreprocessor(
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>,
	preprocessors: QueryPreprocessor[]
): Promise<QueryPreprocessorStage> {
	const stages: QueryPreprocessorStage[] = [];
	for (const buildPreprocessor of preprocessors) {
		const stage = await buildPreprocessor({ engine });
		stages.push(stage);
	}

	return (initialContext: QueryPreprocessorResult): QueryPreprocessorResult => {
		let context: QueryPreprocessorResult = {
			sql: rewriteSql(initialContext.sql),
			parameters: initialContext.parameters,
		};
		for (const stage of stages) {
			context = stage(context);
		}
		return context;
	};
}
