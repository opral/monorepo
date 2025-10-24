import { compile } from "./compile.js";
import { preprocessStatement } from "./preprocess-statement.js";
import { parse } from "./sql-parser/parse.js";
import type {
	PreprocessorArgs,
	PreprocessorFn,
	PreprocessorResult,
} from "./types.js";
import type { PreprocessorContext, PreprocessorTrace } from "./types.js";
import type { LixEngine } from "../boot.js";
import { getAllStoredSchemas } from "../../stored-schema/get-stored-schema.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { schemaKeyToCacheTableName } from "../../state/cache/create-schema-cache-table.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";

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

		const traceEntries = trace ? [] : undefined;
		const context = buildContext(engine, traceEntries);

		const statement = parse(sql);
		const rewritten = preprocessStatement(statement, context);
		const compiled = compile(rewritten);

		return {
			sql: compiled.sql,
			parameters,
			expandedSql: undefined,
			context,
		};
	};
}

type ContextCacheEntry = {
	schemaHash: string;
	storedSchemas: Map<string, LixSchemaDefinition>;
	cacheSignature: string;
	cacheTables: Map<string, string>;
};

const contextCache = new WeakMap<object, ContextCacheEntry>();

function buildContext(
	engine: EngineShape,
	trace: PreprocessorTrace | undefined
): PreprocessorContext {
	const base = resolveCachedResources(engine);

	let storedSchemas: Map<string, unknown> | undefined;
	let cacheTables: Map<string, unknown> | undefined;
	let transactionState: boolean | undefined;

	const context: PreprocessorContext = {
		getStoredSchemas: () => {
			if (!storedSchemas) {
				storedSchemas = base.storedSchemas as Map<string, unknown>;
			}
			return storedSchemas;
		},
		getCacheTables: () => {
			if (!cacheTables) {
				cacheTables = base.cacheTables as Map<string, unknown>;
			}
			return cacheTables;
		},
		hasOpenTransaction: () => {
			if (transactionState === undefined) {
				transactionState = hasOpenTransaction(engine);
			}
			return transactionState;
		},
		...(trace ? { trace } : {}),
	} as PreprocessorContext;

	return context;
}

function resolveCachedResources(engine: EngineShape): ContextCacheEntry {
	const { schemas, signature: schemaHash } = getAllStoredSchemas({ engine });
	const cacheKey = engine.runtimeCacheRef as object;
	let entry = contextCache.get(cacheKey);

	if (!entry || entry.schemaHash !== schemaHash) {
		const storedSchemas = new Map(
			schemas
				.map((item) => item.definition)
				.filter((definition): definition is LixSchemaDefinition => {
					const key = definition["x-lix-key"];
					return typeof key === "string" && key.length > 0;
				})
				.map((definition) => [definition["x-lix-key"], definition] as const)
		);

		entry = {
			schemaHash,
			storedSchemas,
			cacheSignature: "",
			cacheTables: new Map(),
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
