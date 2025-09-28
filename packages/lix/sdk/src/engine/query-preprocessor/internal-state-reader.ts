import {
	initializeSqlRewriter,
	rewriteSql,
	updateSqlRewriterContext,
	type InternalStateReaderCacheHints,
} from "./sql-rewriter.js";
import type {
	QueryPreprocessor,
	QueryPreprocessorResult,
} from "./create-query-preprocessor.js";
import type { LixEngine } from "../boot.js";
import { populateStateCache } from "../../state/cache/populate-state-cache.js";

/**
 * Builds the internal state reader preprocessor that delegates SQL rewriting to the
 * Rust-powered module and keeps the underlying cache tables in sync.
 *
 * @example
 * const preprocess = await createInternalStateReaderPreprocessor({ engine });
 * const result = preprocess({ sql, parameters });
 * const rows = engine.executeSync(result);
 */
export const createInternalStateReaderPreprocessor: QueryPreprocessor = async (
	args: { engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef" | "hooks"> }
) => {
	await initializeSqlRewriter();

	const buildRewriteContext = (
		parameters: ReadonlyArray<unknown>
	): string | undefined => {
		const baseContextJson = updateSqlRewriterContext(args.engine);
		const baseContext = baseContextJson
			? (JSON.parse(baseContextJson) as Record<string, unknown>)
			: {};
		if (parameters.length > 0) {
			const serialisableParameters = parameters.map((value) =>
				typeof value === "bigint" ? value.toString() : value
			);
			baseContext.parameters = serialisableParameters;
		} else {
			delete baseContext.parameters;
		}
		return Object.keys(baseContext).length > 0
			? JSON.stringify(baseContext)
			: undefined;
	};

	const ensureCacheFresh = (cacheHints: InternalStateReaderCacheHints) => {
		populateStateCache({
			engine: args.engine,
			options: {},
		});
		updateSqlRewriterContext(args.engine);
	};

	return (context: QueryPreprocessorResult): QueryPreprocessorResult => {
		const rewriteContext = buildRewriteContext(context.parameters);
		const rewritten = rewriteSql(context.sql, rewriteContext);

		const sql = rewritten?.sql ?? context.sql;
		const cacheHints = rewritten?.cacheHints;

		if (cacheHints?.internalStateReader) {
			ensureCacheFresh(cacheHints.internalStateReader);
		}

		return {
			sql,
			parameters: context.parameters,
		};
	};
};
