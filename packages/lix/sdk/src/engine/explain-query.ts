import type { LixEngine } from "./boot.js";
import { createSchemaCacheTable } from "../state/cache/create-schema-cache-table.js";
import { getStateCacheV2Tables } from "../state/cache/schema.js";

type ExplainQueryStage = {
	original: {
		sql: string;
		parameters: unknown[];
	};
	expanded?: {
		sql: string;
		parameters: unknown[];
	};
	rewritten?: {
		sql: string;
		parameters: unknown[];
	};
	plan: any[];
};

export async function createExplainQuery(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "preprocessQuery" | "executeSync"
	>;
}): Promise<
	(args: { query: { sql: string; parameters: any[] } }) => ExplainQueryStage
> {
	const preprocess = args.engine.preprocessQuery;

	return ({ query }) => {
		const parameters = [...(query.parameters ?? [])];
		const result = preprocess({
			sql: query.sql,
			parameters,
			sideEffects: false,
		});

		ensureCacheTablesForSql(args.engine, result.sql);

		const explainRows = args.engine.sqlite.exec({
			sql: `EXPLAIN QUERY PLAN ${result.sql}`,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		}) as any[];

		const wasRewritten = result.sql !== query.sql;

		return {
			original: {
				sql: query.sql,
				parameters,
			},
			expanded: result.expandedSql
				? {
						sql: result.expandedSql,
						parameters,
					}
				: undefined,
			rewritten: wasRewritten
				? {
						sql: result.sql,
						parameters: [...result.parameters],
					}
				: undefined,
			plan: explainRows,
		};
	};
}

function ensureCacheTablesForSql(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">,
	sql: string
): void {
	const matches = sql.matchAll(/internal_state_cache_([A-Za-z0-9_]+)/g);
	const tableCache = getStateCacheV2Tables({ engine });
	for (const match of matches) {
		const sanitizedSuffix = match[1];
		if (!sanitizedSuffix) continue;
		const tableName = `internal_state_cache_${sanitizedSuffix}`;
		if (tableCache.has(tableName)) continue;
		createSchemaCacheTable({ engine, tableName });
		tableCache.add(tableName);
	}
}
