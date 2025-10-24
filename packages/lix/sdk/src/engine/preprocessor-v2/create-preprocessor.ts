import type { LixEngine } from "../boot.js";
import { compile } from "./compile.js";
import { preprocessRootOperationNode } from "./preprocess-root-operation-node.js";
import { parse } from "./sql-parser/parser.js";
import { toRootOperationNode } from "./sql-parser/to-root-operation-node.js";
import type {
	PreprocessorArgs,
	PreprocessorFn,
	PreprocessorContext,
} from "./types.js";
import { getAllStoredSchemas } from "../../stored-schema/get-stored-schema.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { schemaKeyToCacheTableName } from "../../state/cache/create-schema-cache-table.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

/**
 * Compiles a preprocessor function that parses SQL into a Kysely operation
 * tree, executes the v2 rewrite pipeline, and recompiles the result back to
 * SQL. The transformer context (stored schemas, cache tables, transaction
 * state) is memoised per engine and re-used across calls.
 *
 * Pass `trace: true` when invoking the returned function to collect per-step
 * trace entries for debugging.
 */
export function createPreprocessor(args: {
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "hooks"
		| "runtimeCacheRef"
		| "executeSync"
		| "call"
		| "listFunctions"
	>;
}): PreprocessorFn {
	const { engine } = args;

	return ({ sql, parameters, sideEffects, trace }: PreprocessorArgs) => {
		void sideEffects;

		const baseContext = getContext(engine);
		const traceEntries = trace ? [] : undefined;

		const preprocessed = preprocessRootOperationNode(
			toRootOperationNode(parse(sql)),
			{
				storedSchemas: baseContext.storedSchemas,
				cacheTables: baseContext.cacheTables,
				hasOpenTransaction: baseContext.hasOpenTransaction,
				trace: traceEntries,
			}
		);

		const compiled = compile(preprocessed);

		const resultContext = traceEntries
			? {
					storedSchemas: baseContext.storedSchemas,
					cacheTables: baseContext.cacheTables,
					hasOpenTransaction: baseContext.hasOpenTransaction,
					trace: traceEntries,
				}
			: baseContext;

		return {
			sql: compiled.sql,
			parameters,
			expandedSql: undefined,
			context: resultContext,
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

function getContext(
	engine: Pick<
		LixEngine,
		| "executeSync"
		| "runtimeCacheRef"
		| "hooks"
		| "sqlite"
		| "call"
		| "listFunctions"
	>
): PreprocessorContext {
	const { schemas, signature: schemaHash } = getAllStoredSchemas({ engine });
	let entry = contextCache.get(engine.runtimeCacheRef);

	if (!entry || entry.schemaHash !== schemaHash) {
		const storedSchemas = new Map(
			schemas
				.map((item) => item.definition)
				.filter((definition) => {
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
		contextCache.set(engine.runtimeCacheRef, entry);
	}

	const cacheTablesSet = getStateCacheTables({ engine });
	const cacheSignature = buildCacheSignature(cacheTablesSet);
	if (entry.cacheSignature !== cacheSignature) {
		entry.cacheTables = buildCacheTableMap(entry.storedSchemas, cacheTablesSet);
		entry.cacheSignature = cacheSignature;
		contextCache.set(engine.runtimeCacheRef, entry);
	}

	const hasTransaction = hasOpenTransaction(engine);

	return {
		storedSchemas: entry.storedSchemas,
		cacheTables: entry.cacheTables,
		hasOpenTransaction: hasTransaction,
	};
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
