import {
	SqliteQueryCompiler,
	type CompiledQuery,
	type KyselyPlugin,
} from "kysely";

import type { LixEngine } from "../boot.js";
import { createCachePopulator } from "./cache-populator.js";
import { rewriteStateView } from "./rewriters/state.js";
import { rewriteStateAllView } from "./rewriters/state-all.js";
import { rewriteInternalResolvedStateAll } from "./rewriters/internal-resolved-state-all.js";

export function createQueryPreprocessor(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeQuerySync" | "executeSync"
	>;
}): (input: { query: CompiledQuery<unknown> }) => CompiledQuery<unknown> {
	const plugins: KyselyPlugin[] = [createCachePopulator(args)];
	const rewriters = [
		rewriteStateView,
		rewriteStateAllView,
		rewriteInternalResolvedStateAll,
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
