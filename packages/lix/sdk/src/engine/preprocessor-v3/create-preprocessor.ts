import { compile } from "./compile.js";
import { parse } from "./sql-parser/parse.js";
import type {
	PreprocessorArgs,
	PreprocessorFn,
	PreprocessorStep,
} from "./types.js";
import type { PreprocessorContext, PreprocessorTrace } from "./types.js";
import type { LixEngine } from "../boot.js";
import { getAllStoredSchemas } from "../../stored-schema/get-stored-schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { cacheTableNameToSchemaKey } from "../../state/cache/create-schema-cache-table.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import { createCelEnvironment } from "./steps/entity-view/cel-environment.js";
import type { CelEnvironment } from "./steps/entity-view/cel-environment.js";
import { expandSqlViews } from "./steps/expand-sql-views.js";
import { rewriteEntityViewInsert } from "./steps/entity-view/insert.js";
import { rewriteEntityViewUpdate } from "./steps/entity-view/update.js";
import { rewriteEntityViewDelete } from "./steps/entity-view/delete.js";
import { rewriteEntityViewSelect } from "./steps/entity-view/select.js";
import { rewriteStateViewSelect } from "./steps/state-view/select.js";
import { rewriteStateAllViewSelect } from "./steps/state-all-view/select.js";
import { cachePopulator } from "./steps/cache-populator.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";
import type { StatementNode } from "./sql-parser/nodes.js";

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
	expandSqlViews,
	rewriteEntityViewInsert,
	rewriteEntityViewUpdate,
	rewriteEntityViewDelete,
	rewriteEntityViewSelect,
	rewriteStateViewSelect,
	rewriteStateAllViewSelect,
	cachePopulator,
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

	return ({ sql, parameters, sideEffects, trace }: PreprocessorArgs) => {
		void sideEffects;

		const traceEntries: PreprocessorTrace | undefined = trace ? [] : undefined;
		const context = buildContext(engine, traceEntries);

		const statement = parse(sql);
		const rewritten = pipeline.reduce(
			(current, step) =>
				step({
					node: current,
					parameters,
					getStoredSchemas: context.getStoredSchemas,
					getCacheTables: context.getCacheTables,
					getSqlViews: context.getSqlViews,
					hasOpenTransaction: context.hasOpenTransaction,
					getCelEnvironment: context.getCelEnvironment,
					getEngine: context.getEngine,
					trace: context.trace,
				}) as StatementNode,
			statement
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
			expandedSql:
				rewritten.node_kind === "raw_fragment" ? compiled.sql : undefined,
			context,
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
