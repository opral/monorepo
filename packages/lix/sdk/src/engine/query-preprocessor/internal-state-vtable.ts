import {
	initializeSqlRewriter,
	rewriteSql,
	updateSqlRewriterContext,
	buildSqlRewriteContext,
	type InternalStateVtableCacheHints,
} from "./sql-rewriter.js";
import type { QueryPreprocessor } from "./create-query-preprocessor.js";
import type {
	QueryPreprocessorResult,
	QueryPreprocessorFn,
} from "./create-query-preprocessor-v2.js";
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

		return ({
			sql,
			parameters,
			sideEffects,
		}: Parameters<QueryPreprocessorFn>[0]): QueryPreprocessorResult => {
			const trimmedSql = sql.trimStart();
			const lowerSql = trimmedSql.toLowerCase();
			const isSelect =
				lowerSql.startsWith("select") || lowerSql.startsWith("with");
			if (!isSelect) {
				return { sql, parameters };
			}
			const rewriteContext = buildSqlRewriteContext({
				engine: args.engine,
				parameters,
			});
			const rewritten = rewriteSql(sql, rewriteContext);

			const nextSql = rewritten?.rewrittenSql ?? sql;
			const cacheHints = rewritten?.cacheHints;

			if (cacheHints?.internalStateVtable && sideEffects !== false) {
				ensureCacheFresh(cacheHints.internalStateVtable);
			}

			return {
				sql: nextSql,
				parameters,
			};
		};
	};
