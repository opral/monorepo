import { compile } from "./sql-parser/compile.js";
import { parse } from "./sql-parser/parse.js";
import type {
	PreprocessMode,
	PreprocessorArgs,
	PreprocessorFn,
	PreprocessorStep,
} from "./types.js";
import type { PreprocessorContext, PreprocessorTrace } from "./types.js";
import type { LixEngine } from "../boot.js";
import { getAllStoredSchemas } from "../../stored-schema/get-stored-schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { normalizeIdentifierValue } from "./sql-parser/ast-helpers.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { cacheTableNameToSchemaKey } from "../../state/cache/create-schema-cache-table.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import { expandSqlViews } from "./steps/expand-sql-views.js";
import { cachePopulator } from "./steps/cache-populator.js";
import { rewriteActiveVersionSubquery } from "./steps/rewrite-active-version-subquery.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";
import {
	createCelEnvironment,
	type CelEnvironment,
} from "../cel-environment/cel-environment.js";
import { rewriteEntityViewSelect } from "./entity-views/select.js";
import { rewriteEntityViewInsert } from "./entity-views/insert.js";
import { rewriteEntityViewUpdate } from "./entity-views/update.js";
import { rewriteEntityViewDelete } from "./entity-views/delete.js";
import { rewriteVtableInsertOnConflict } from "./steps/rewrite-vtable-insert-on-conflict.js";
import { getVersionInheritanceSnapshot } from "./inheritance/version-inheritance-cache.js";
import { rewriteStateByVersionInsert } from "./state-by-version/insert.js";
import { rewriteStateByVersionUpdate } from "./state-by-version/update.js";
import { rewriteStateByVersionDelete } from "./state-by-version/delete.js";
import { rewriteStateByVersionSelect } from "./state-by-version/select.js";

type EngineShape = Pick<
	LixEngine,
	| "sqlite"
	| "hooks"
	| "runtimeCacheRef"
	| "executeSync"
	| "call"
	| "listFunctions"
>;

const fullPipeline: PreprocessorStep[] = [
	rewriteEntityViewInsert,
	rewriteEntityViewUpdate,
	rewriteEntityViewDelete,
	rewriteStateByVersionInsert,
	rewriteStateByVersionUpdate,
	rewriteStateByVersionDelete,
	rewriteVtableInsertOnConflict,
	rewriteEntityViewSelect,
	expandSqlViews,
	rewriteStateByVersionSelect,
	cachePopulator,
	rewriteActiveVersionSubquery,
	rewriteVtableSelects,
];

const vtableOnlyPipeline: PreprocessorStep[] = [
	rewriteStateByVersionInsert,
	rewriteStateByVersionUpdate,
	rewriteStateByVersionDelete,
	rewriteVtableInsertOnConflict,
	rewriteStateByVersionSelect,
	cachePopulator,
	rewriteActiveVersionSubquery,
	rewriteVtableSelects,
];

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

	return ({ sql, parameters, trace, mode = "full" }: PreprocessorArgs) => {
		const traceEntries: PreprocessorTrace | undefined = trace ? [] : undefined;
		const context = buildContext(engine, traceEntries);

		if (mode === "none") {
			if (traceEntries) {
				traceEntries.push({
					step: "complete",
					payload: null,
				});
			}
			return {
				sql,
				parameters,
				trace: traceEntries,
			};
		}

		const statements = parse(sql);
		const pipeline = selectPipeline(mode);
		const rewritten = pipeline.reduce(
			(current, step) =>
				step({
					statements: current,
					parameters,
					getStoredSchemas: context.getStoredSchemas,
					getCacheTables: context.getCacheTables,
					getSqlViews: context.getSqlViews,
					hasOpenTransaction: context.hasOpenTransaction,
					getCelEnvironment: context.getCelEnvironment,
					getEngine: context.getEngine,
					getVersionInheritance: context.getVersionInheritance,
					getActiveVersionId: context.getActiveVersionId,
					trace: context.trace,
				}),
			statements
		);

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
			trace: traceEntries,
		};
	};
}

function selectPipeline(mode: PreprocessMode): readonly PreprocessorStep[] {
	if (mode === "vtable-select-only") {
		return vtableOnlyPipeline;
	}
	return fullPipeline;
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
	let cachedActiveVersionId: string | null | undefined;

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

	const loadActiveVersionId = (): string | null => {
		if (cachedActiveVersionId !== undefined) {
			return cachedActiveVersionId;
		}
		try {
			const rows = engine.sqlite.exec({
				sql: "SELECT version_id FROM active_version LIMIT 1",
				returnValue: "resultRows",
				rowMode: "object",
				columnNames: [],
			}) as Array<{ version_id: string | null }>;
			const versionId = rows[0]?.version_id;
			cachedActiveVersionId =
				typeof versionId === "string" && versionId.length > 0
					? versionId
					: null;
		} catch (error) {
			cachedActiveVersionId = null;
		}
		return cachedActiveVersionId;
	};

	const context: PreprocessorContext = {
		getStoredSchemas: () => {
			return loadStoredSchemas();
		},
		getCacheTables: () => {
			return loadCacheTables();
		},
		getSqlViews: () => {
			// return new Map();
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
		getVersionInheritance: () => getVersionInheritanceSnapshot({ engine }),
		getActiveVersionId: () => loadActiveVersionId(),
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
		const normalized = normalizeIdentifierValue(name);
		// Exclude the public state_by_version view from expansion; it is rewritten
		// by the dedicated preprocessor step instead.
		if (normalized === "state_by_version") {
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
