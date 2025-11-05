import type { LixEngine } from "./boot.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../state/cache/create-schema-cache-table.js";
import { getStateCacheTables } from "../state/cache/schema.js";
import { listAvailableCacheSchemas } from "../state/cache/schema-resolver.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

type ExplainQueryStage = {
	originalSql: string;
	parameters: unknown[];
	rewrittenSql?: string;
	plan: any[];
};

export function createExplainQuery(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "preprocessQuery" | "executeSync"
	>;
}): (args: { sql: string; parameters: any[] }) => ExplainQueryStage {
	const preprocess = args.engine.preprocessQuery;

	return ({ sql, parameters }) => {
		const result = preprocess({
			sql,
			parameters,
			// sideEffects removed false,
		});

		ensureCacheTablesForSql(args.engine, result.sql);

		const explainRows = args.engine.sqlite.exec({
			sql: `EXPLAIN QUERY PLAN ${result.sql}`,
			bind: result.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		}) as any[];

		const wasRewritten = result.sql !== sql;

		return {
			originalSql: sql,
			parameters,
			rewrittenSql: wasRewritten ? result.sql : undefined,
			plan: explainRows,
		};
	};
}

function ensureCacheTablesForSql(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">,
	sql: string
): void {
	const matches = sql.matchAll(/lix_internal_state_cache_([A-Za-z0-9_]+)/g);
	const tableCache = getStateCacheTables({ engine });
	const availableSchemas = listAvailableCacheSchemas({ engine });
	const tableToSchema = new Map<string, LixSchemaDefinition>();
	for (const [schemaKey, definition] of availableSchemas.entries()) {
		const tableName = schemaKeyToCacheTableName(schemaKey);
		tableToSchema.set(tableName, definition);
	}
	for (const match of matches) {
		const tableName = match[0];
		if (!tableName) continue;
		if (tableCache.has(tableName)) continue;
		const schemaDefinition = tableToSchema.get(tableName);
		if (!schemaDefinition) {
			continue;
		}
		const created = createSchemaCacheTable({
			engine,
			schema: schemaDefinition,
		});
		tableCache.add(created);
		if (created !== tableName) {
			tableCache.add(tableName);
		}
	}
}
