import {
	initializeSqlRewriter,
	rewriteSql,
	updateSqlRewriterContext,
	buildSqlRewriteContext,
	type InternalStateReaderCacheHints,
} from "./sql-rewriter.js";
import type {
	QueryPreprocessor,
	QueryPreprocessorResult,
} from "./create-query-preprocessor.js";
import type { LixEngine } from "../boot.js";
import { populateStateCache } from "../../state/cache/populate-state-cache.js";
import { isStaleStateCache } from "../../state/cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";

/**
 * Builds the internal state reader preprocessor that delegates SQL rewriting to the
 * Rust-powered module and keeps the underlying cache tables in sync.
 *
 * @example
 * const preprocess = await createInternalStateReaderPreprocessor({ engine });
 * const result = preprocess({ sql, parameters });
 * const rows = engine.executeSync(result);
 */
export const createInternalStateReaderPreprocessor: QueryPreprocessor =
	async (args: {
		engine: Pick<
			LixEngine,
			"sqlite" | "runtimeCacheRef" | "hooks" | "executeSync"
		>;
	}) => {
		await initializeSqlRewriter({ engine: args.engine });

		const ensureCacheFresh = (cacheHints: InternalStateReaderCacheHints) => {
			if (!isStaleStateCache({ engine: args.engine })) {
				return;
			}
			populateStateCache({
				engine: args.engine,
				options: {},
			});
			markStateCacheAsFresh({ engine: args.engine });
			updateSqlRewriterContext(args.engine);
		};

		return (context: QueryPreprocessorResult): QueryPreprocessorResult => {
			if (!/\binternal_state_reader\b/i.test(context.sql)) {
				return context;
			}
			const rewriteContext = buildSqlRewriteContext({
				engine: args.engine,
				parameters: context.parameters,
			});
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
