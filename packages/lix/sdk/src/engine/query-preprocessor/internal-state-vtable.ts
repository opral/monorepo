import {
	initializeSqlRewriter,
	rewriteSql,
	updateSqlRewriterContext,
	buildSqlRewriteContext,
	type InternalStateVtableCacheHints,
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
 * Builds the internal state vtable preprocessor that delegates SQL rewriting to the
 * Rust-powered module and keeps the underlying cache tables in sync.
 *
 * @example
 * const preprocess = await createInternalStateVtablePreprocessor({ engine });
 * const result = preprocess({ sql, parameters });
 * const rows = engine.executeSync(result);
 */
export const createInternalStateVtablePreprocessor: QueryPreprocessor =
	async (args: {
		engine: Pick<
			LixEngine,
			"sqlite" | "runtimeCacheRef" | "hooks" | "executeSync"
		>;
	}) => {
		await initializeSqlRewriter({ engine: args.engine });

		const ensureCacheFresh = (cacheHints: InternalStateVtableCacheHints) => {
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
			const trimmedSql = context.sql.trimStart();
			const lowerSql = trimmedSql.toLowerCase();
			const isSelect =
				lowerSql.startsWith("select") || lowerSql.startsWith("with");
			if (!isSelect) {
				return context;
			}
			const rewriteContext = buildSqlRewriteContext({
				engine: args.engine,
				parameters: context.parameters,
			});
			const rewritten = rewriteSql(context.sql, rewriteContext);

			const sql = rewritten?.rewrittenSql ?? context.sql;
			const cacheHints = rewritten?.cacheHints;

			if (cacheHints?.internalStateVtable) {
				ensureCacheFresh(cacheHints.internalStateVtable);
			}

			return {
				sql,
				parameters: context.parameters,
				expandedSql: context.expandedSql,
			};
		};
	};
