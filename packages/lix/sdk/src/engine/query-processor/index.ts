import {
	SqliteQueryCompiler,
	type CompiledQuery,
	type KyselyPlugin,
} from "kysely";

import type { LixEngine } from "../boot.js";
import { createCachePopulator } from "./cache-populator.js";
import { createQueryRouter } from "./router.js";

export function createQueryCompiler(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef"
	>;
}): (input: { query: CompiledQuery<unknown> }) => CompiledQuery<unknown> {
	const plugins: KyselyPlugin[] = [
		createCachePopulator(args),
		createQueryRouter(),
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

		return new SqliteQueryCompiler().compileQuery(operationNode, query.queryId);
	};
}
