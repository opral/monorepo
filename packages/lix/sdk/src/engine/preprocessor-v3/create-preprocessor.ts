import { compile } from "./compile.js";
import { preprocessStatement } from "./preprocess-statement.js";
import { parse } from "./sql-parser/parse.js";
import type { PreprocessorArgs, PreprocessorFn } from "./types.js";
import type { PreprocessorContext, PreprocessorTrace } from "./types.js";
import type { LixEngine } from "../boot.js";
import { getAllStoredSchemas } from "../../stored-schema/get-stored-schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { schemaKeyToCacheTableName } from "../../state/cache/create-schema-cache-table.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import { getSchemaVersion } from "../query-preprocessor/shared/schema-version.js";
import { createCelEnvironment } from "./steps/entity-view/cel-environment.js";
import type { CelEnvironment } from "./steps/entity-view/cel-environment.js";

type EngineShape = Pick<
	LixEngine,
	| "sqlite"
	| "hooks"
	| "runtimeCacheRef"
	| "executeSync"
	| "call"
	| "listFunctions"
>;

/**
 * Creates a v3 preprocessor instance that parses SQL into the v3 AST, executes
 * the rewrite pipeline, and compiles the result back to SQL text.
 *
 * @example
 * ```ts
 * const preprocess = createPreprocessor({ engine });
 * const result = preprocess({ sql: "SELECT 1", parameters: [] });
 * ```
 */
export function createPreprocessor(args: {
	engine: EngineShape;
}): PreprocessorFn {
	const { engine } = args;

	return ({ sql, parameters, sideEffects, trace }: PreprocessorArgs) => {
		void sideEffects;

		const traceEntries: PreprocessorTrace | undefined = trace ? [] : undefined;
		const context = buildContext(engine, traceEntries);

		const statement = parse(sql);
		const rewritten = preprocessStatement(statement, context, parameters);

		if (traceEntries) {
			traceEntries.push({
				step: "complete",
				payload: { ast: structuredClone(rewritten) },
			});
		}

		const compiled = compile(rewritten);

		return {
			sql: compiled.sql,
			parameters,
			expandedSql:
				rewritten.node_kind === "raw_fragment" ? compiled.sql : undefined,
			context,
		};
	};
}

type ContextCacheEntry = {
	schemaHash: string;
	storedSchemas: Map<string, LixSchemaDefinition>;
	cacheSignature: string;
	cacheTables: Map<string, string>;
	viewSignature: string;
	sqlViews: Map<string, string>;
};

const contextCache = new WeakMap<object, ContextCacheEntry>();

function buildContext(
	engine: EngineShape,
	trace: PreprocessorTrace | undefined
): PreprocessorContext {
	let baseEntry: ContextCacheEntry | undefined;
	let storedSchemas: Map<string, unknown> | undefined;
	let cacheTables: Map<string, unknown> | undefined;
	let sqlViews: Map<string, string> | undefined;
	let transactionState: boolean | undefined;
	let celEnvironment: CelEnvironment | undefined;

	const resolveBase = (): ContextCacheEntry => {
		if (!baseEntry) {
			baseEntry = resolveCachedResources(engine);
		}
		return baseEntry;
	};

	const context: PreprocessorContext = {
		getStoredSchemas: () => {
			if (!storedSchemas) {
				storedSchemas = resolveBase().storedSchemas as Map<string, unknown>;
			}
			return storedSchemas;
		},
		getCacheTables: () => {
			if (!cacheTables) {
				cacheTables = resolveBase().cacheTables as Map<string, unknown>;
			}
			return cacheTables;
		},
		getSqlViews: () => {
			if (!sqlViews) {
				sqlViews = resolveBase().sqlViews;
			}
			return sqlViews;
		},
		hasOpenTransaction: () => {
			if (transactionState === undefined) {
				transactionState = hasOpenTransaction(engine);
			}
			return transactionState;
		},
		getCelEnvironment: () => {
			if (!celEnvironment) {
				celEnvironment = createCelEnvironment({ engine });
			}
			return celEnvironment ?? null;
		},
		getEngine: () => engine,
		...(trace ? { trace } : {}),
	} as PreprocessorContext;

	return context;
}

function resolveCachedResources(engine: EngineShape): ContextCacheEntry {
	const { schemas, signature: schemaHash } = getAllStoredSchemas({ engine });
	const cacheKey = engine.runtimeCacheRef as object;
	let entry = contextCache.get(cacheKey);

	if (!entry || entry.schemaHash !== schemaHash) {
		const storedSchemas = new Map<string, LixSchemaDefinition>();
		for (const item of schemas) {
			const definition = item.definition;
			const key = definition["x-lix-key"];
			if (typeof key !== "string" || key.length === 0) {
				continue;
			}
			registerSchemaDefinition(storedSchemas, key, definition);
		}

		entry = {
			schemaHash,
			storedSchemas,
			cacheSignature: "",
			cacheTables: new Map(),
			viewSignature: "",
			sqlViews: new Map(),
		};
		contextCache.set(cacheKey, entry);
	}

	const cacheTablesSet = getStateCacheTables({ engine });
	const cacheSignature = buildCacheSignature(cacheTablesSet);
	if (entry.cacheSignature !== cacheSignature) {
		entry.cacheTables = buildCacheTableMap(entry.storedSchemas, cacheTablesSet);
		entry.cacheSignature = cacheSignature;
		contextCache.set(cacheKey, entry);
	}

	const currentViewSignature = getSqlViewSignature(engine);
	if (entry.viewSignature !== currentViewSignature) {
		entry.sqlViews = loadSqlViewMap(engine);
		entry.viewSignature = currentViewSignature;
		contextCache.set(cacheKey, entry);
	}

	return entry;
}

function buildCacheTableMap(
	storedSchemas: Map<string, LixSchemaDefinition>,
	tableSet: Set<string>
): Map<string, string> {
	const map = new Map<string, string>();
	for (const [key] of storedSchemas) {
		const tableName = schemaKeyToCacheTableName(key);
		if (tableSet.has(tableName)) {
			map.set(key, tableName);
		}
	}
	return map;
}

function buildCacheSignature(tables: Set<string>): string {
	return Array.from(tables).sort().join("|");
}

function registerSchemaDefinition(
	map: Map<string, LixSchemaDefinition>,
	key: string,
	definition: LixSchemaDefinition
): void {
	const baseKeys = new Set<string>([key]);
	if (key.startsWith("lix_")) {
		const alias = key.slice(4);
		if (alias.length > 0) {
			baseKeys.add(alias);
		}
	}
	for (const baseKey of baseKeys) {
		map.set(baseKey, definition);
		map.set(`${baseKey}_all`, definition);
		map.set(`${baseKey}_history`, definition);
	}
}

function getSqlViewSignature(engine: EngineShape): string {
	const version = getSchemaVersion(engine.sqlite);
	return String(version);
}

function loadSqlViewMap(engine: EngineShape): Map<string, string> {
	const result = engine.sqlite.exec({
		sql: "SELECT name, sql FROM sqlite_schema WHERE type = 'view' AND sql IS NOT NULL",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});

	const map = new Map<string, string>();
	for (const row of result as Array<Record<string, unknown>>) {
		const name = typeof row.name === "string" ? row.name : undefined;
		const sqlText = typeof row.sql === "string" ? row.sql : undefined;
		if (!name || !sqlText) {
			continue;
		}
		const selectSql = extractSelectBody(sqlText);
		if (!selectSql) {
			continue;
		}
		map.set(name, selectSql);
	}
	return map;
}

function extractSelectBody(sql: string): string | undefined {
	const trimmed = sql.trim();
	if (!trimmed) {
		return undefined;
	}
	const withoutPrefix = trimmed.replace(/^[\s\S]*?\bAS\b\s*/i, "");
	if (withoutPrefix === trimmed) {
		return undefined;
	}
	let statement = withoutPrefix.trim();
	const semicolon = statement.indexOf(";");
	if (semicolon !== -1) {
		statement = statement.slice(0, semicolon);
	}
	return statement.trim() || undefined;
}
