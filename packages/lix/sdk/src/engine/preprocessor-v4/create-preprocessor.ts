import type { PreprocessorArgs, PreprocessorFn } from "./types.js";
import type {
	PreprocessorContext,
	PreprocessorStatement,
	PreprocessorTrace,
	CachePreflight,
	CachePreflightResult,
} from "./types.js";
import type { LixEngine } from "../boot.js";
import { getAllStoredSchemas } from "../../stored-schema/get-stored-schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { cacheTableNameToSchemaKey } from "../../state/cache/create-schema-cache-table.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import {
	createCelEnvironment,
	type CelEnvironment,
} from "../cel-environment/cel-environment.js";
import { splitStatements } from "./steps/split-statements.js";
import { normalizePlaceholders } from "./steps/normalize-placeholders.js";
import { expandViews } from "./steps/expand-views.js";
import { rewriteEntityViewSelects } from "./steps/entity-views/select.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";
import { cachePopulator } from "./steps/cache-populator.js";
import type { PreprocessorStep } from "./types.js";

type EngineShape = Pick<
	LixEngine,
	| "sqlite"
	| "hooks"
	| "runtimeCacheRef"
	| "executeSync"
	| "call"
	| "listFunctions"
>;

const pipeline: PreprocessorStep[] = [
	splitStatements,
	normalizePlaceholders,
	expandViews,
	rewriteEntityViewSelects,
	rewriteVtableSelects,
	cachePopulator,
];

/**
 * Creates a preprocessor instance that parses SQL into the v3 AST, executes
 * the rewrite pipeline, and compiles the result back to SQL text.
 *
 * @example
 * ```ts
 * const preprocess = createPreprocessor({ engine });
 * const result = preprocess({ sql: "SELECT 1", parameters: [] });
 * ```
 */
export function createPreprocessor(args: { engine: EngineShape }): PreprocessorFn {
	const { engine } = args;

	return ({ sql, parameters, trace }: PreprocessorArgs) => {
		const traceEntries: PreprocessorTrace | undefined = trace ? [] : undefined;
		const context = buildContext(engine, traceEntries);

		const initial: { statements: ReadonlyArray<PreprocessorStatement> } = {
			statements: [
				{
					sql,
					parameters,
				},
			],
		};

		const rewritten = pipeline.reduce(
			(current, step) =>
				step({
					statements: current.statements,
					getStoredSchemas: context.getStoredSchemas,
					getCacheTables: context.getCacheTables,
					getSqlViews: context.getSqlViews,
					hasOpenTransaction: context.hasOpenTransaction,
					getCelEnvironment: context.getCelEnvironment,
					getEngine: context.getEngine,
					trace: context.trace,
					cachePreflight: context.cachePreflight,
				}),
			initial
		);

		const finalStatements = rewritten.statements;

		if (traceEntries) {
			traceEntries.push({
				step: "complete",
				payload: { statements: structuredClone(finalStatements) },
			});
		}

		const resultSql = finalStatements
			.map((statement) => statement.sql)
			.join(";\n");
		const primaryParameters =
			finalStatements.length === 1
				? (finalStatements[0]?.parameters ?? parameters)
				: parameters;

		const cachePreflightState = context.cachePreflight;
		const cachePreflight = cachePreflightState
			? serializeCachePreflight(cachePreflightState)
			: undefined;

		return {
			sql: resultSql,
			parameters: primaryParameters,
			expandedSql: resultSql,
			statements: finalStatements,
			trace: traceEntries,
			cachePreflight,
		};
	};
}

function buildContext(
	engine: EngineShape,
	trace: PreprocessorTrace | undefined
): PreprocessorContext {
	let storedSchemas: Map<string, LixSchemaDefinition> | undefined;
	let cacheTables: Map<string, string> | undefined;
	let sqlViews: Map<string, string> | undefined;
	let transactionState: boolean | undefined;
	let celEnvironment: CelEnvironment | undefined;
	const cachePreflightState: CachePreflight = {
		schemaKeys: new Set<string>(),
		versionIds: new Set<string>(),
	};

	const loadStoredSchemas = (): Map<string, LixSchemaDefinition> => {
		if (!storedSchemas) {
			const { definitions } = getAllStoredSchemas({ engine });
			storedSchemas = definitions;
		}
		return storedSchemas;
	};

	const loadCacheTables = (): Map<string, string> => {
		if (!cacheTables) {
			const cacheTableSet = getStateCacheTables({ engine });
			cacheTables = buildCacheTableMap(cacheTableSet);
		}
		return cacheTables;
	};

	const context: PreprocessorContext = {
		getStoredSchemas: () => {
			return loadStoredSchemas();
		},
		getCacheTables: () => {
			return loadCacheTables();
		},
		getSqlViews: () => {
			if (!sqlViews) {
				sqlViews = loadSqlViewMap(engine);
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
		cachePreflight: cachePreflightState,
		...(trace ? { trace } : {}),
	} as PreprocessorContext;

	return context;
}

function buildCacheTableMap(tableSet: Set<string>): Map<string, string> {
	const map = new Map<string, string>();
	for (const tableName of tableSet) {
		const key = cacheTableNameToSchemaKey(tableName);
		map.set(key, tableName);
	}
	return map;
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

const serializeCachePreflight = (
	state: CachePreflight
): CachePreflightResult | undefined => {
	const schemaKeys = Array.from(state.schemaKeys);
	const versionIds = Array.from(state.versionIds);
	if (schemaKeys.length === 0 && versionIds.length === 0) {
		return undefined;
	}
	return {
		schemaKeys,
		versionIds,
	};
};

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
