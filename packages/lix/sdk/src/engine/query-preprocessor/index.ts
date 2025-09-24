import {
	SqliteQueryCompiler,
	type CompiledQuery,
	type KyselyPlugin,
	type RootOperationNode,
} from "kysely";

import type { LixEngine } from "../boot.js";
import { createCachePopulator } from "./cache-populator.js";
import { rewriteStateView } from "./rewriters/state.js";
import { rewriteStateAllView } from "./rewriters/state-all.js";
import { createResolvedStateRewriter } from "./rewriters/internal-resolved-state-all.js";
import { createInternalStateRewriter } from "./rewriters/internal-state-reader.js";
import { getStateCacheV2Tables } from "../../state/cache/schema.js";

export function createQueryPreprocessor(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeQuerySync" | "executeSync"
	>;
}): (input: { query: CompiledQuery<unknown> }) => CompiledQuery<unknown> {
	const plugins: KyselyPlugin[] = [createCachePopulator(args)];

	const internalStateRewriter = createInternalStateRewriter({
		engine: args.engine,
	});
	const rewriters: Array<(node: RootOperationNode) => RootOperationNode> = [
		internalStateRewriter,
	];

	return ({ query }) => {
		// guard against raw sql queries
		if (!query.query) {
			return query;
		}

		let operationNode = query.query;
		for (const plugin of plugins) {
			if (plugin.transformQuery) {
				operationNode = plugin.transformQuery({
					node: operationNode,
					queryId: query.queryId,
				});
			}
		}

		for (const rewrite of rewriters) {
			operationNode = rewrite(operationNode);
		}

		return new SqliteQueryCompiler().compileQuery(operationNode, query.queryId);
	};
}
