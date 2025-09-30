import initSqlParserWasm, {
	rewrite_sql as rewrite_sql_wasm,
	set_rewrite_context as set_rewrite_context_wasm,
} from "../../../rust/sql-rewriter/pkg/lix_sqlparser.js";
import { getStateCacheV2Tables } from "../../state/cache/schema.js";
import type { LixEngine } from "../boot.js";

export interface InternalStateVtableCacheHints {
	schemaKeys: string[];
	includeInheritance: boolean;
}

export interface SqlRewriteCacheHints {
	internalStateVtable?: InternalStateVtableCacheHints;
}

export interface SqlRewriteResult {
	rewrittenSql: string;
	cacheHints?: SqlRewriteCacheHints;
	expandedSql?: string;
}

const isNodeRuntime =
	typeof globalThis === "object" &&
	typeof (globalThis as any).process !== "undefined" &&
	Boolean((globalThis as any).process?.versions?.node);

let initializationPromise: Promise<void> | undefined;
let initialized = false;
let pendingContextJson: string | null | undefined;
let cachedBytes: Uint8Array | undefined;

async function loadWasmBytes(): Promise<Uint8Array> {
	if (cachedBytes) {
		return cachedBytes;
	}

	const wasmUrl = new URL(
		"../../../rust/sql-rewriter/pkg/lix_sqlparser_bg.wasm",
		import.meta.url
	);

	if (isNodeRuntime) {
		// @ts-expect-error - node types
		const { readFile } = await import("node:fs/promises");
		const bytes = await readFile(wasmUrl);
		cachedBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
		return cachedBytes;
	}

	const response = await fetch(wasmUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch WebAssembly module at ${wasmUrl} (status ${response.status})`
		);
	}
	const buffer = await response.arrayBuffer();
	cachedBytes = new Uint8Array(buffer);
	return cachedBytes;
}

async function ensureInitialized(): Promise<void> {
	if (initialized) {
		return;
	}

	if (!initializationPromise) {
		initializationPromise = (async () => {
			const bytes = await loadWasmBytes();
			// @ts-expect-error - type mismatch
			await initSqlParserWasm(bytes);
			initialized = true;
			if (pendingContextJson !== undefined) {
				set_rewrite_context_wasm(pendingContextJson);
			}
		})();

		initializationPromise = initializationPromise.catch((error) => {
			initializationPromise = undefined;
			throw error;
		});
	}

	await initializationPromise;
}

function assertInitialized(): void {
	if (!initialized) {
		throw new Error(
			"Rust SQL parser WASM module has not been initialised yet. Call await initializeSqlParser() before rewriting queries."
		);
	}
}

type ViewSelectCacheEntry = {
	schemaVersion: number;
	map: Map<string, string>;
};

const viewSelectCache = new WeakMap<object, ViewSelectCacheEntry>();

function getSchemaVersion(sqlite: Pick<LixEngine, "sqlite">["sqlite"]): number {
	const result = sqlite.exec({
		sql: "PRAGMA schema_version;",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});
	const rows = result as Array<Record<string, unknown>>;
	const value = rows[0]?.schema_version;
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "bigint") {
		return Number(value);
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
}

function loadViewSelectMap(
	sqlite: Pick<LixEngine, "sqlite">["sqlite"]
): Map<string, string> {
	const result = sqlite.exec({
		sql: "SELECT name, sql FROM sqlite_schema WHERE type = 'view' AND sql IS NOT NULL",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});

	const viewMap = new Map<string, string>();

	for (const row of result as Array<Record<string, unknown>>) {
		const nameValue = row.name;
		const sqlValue = row.sql;
		if (typeof nameValue !== "string") {
			continue;
		}
		const selectSql = extractSelectFromCreateView(
			typeof sqlValue === "string" ? sqlValue : undefined
		);
		if (!selectSql) {
			continue;
		}
		viewMap.set(nameValue, selectSql);
	}

	return viewMap;
}

function primeViewSelectCache(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): void {
	getViewSelectMap(engine);
}

export async function initializeSqlRewriter(args?: {
	engine?: Pick<LixEngine, "sqlite" | "runtimeCacheRef">;
}): Promise<void> {
	await ensureInitialized();
	if (args?.engine) {
		primeViewSelectCache(args.engine);
	}
}

function toSerialisableParameters(
	parameters: ReadonlyArray<unknown>
): unknown[] {
	return parameters.map((value) =>
		typeof value === "bigint" ? value.toString() : value
	);
}

export function buildSqlRewriteContext(args: {
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">;
	parameters: ReadonlyArray<unknown>;
}): string | undefined {
	const baseContextJson = updateSqlRewriterContext(args.engine);
	const baseContext = baseContextJson
		? (JSON.parse(baseContextJson) as Record<string, unknown>)
		: {};

	if (args.parameters.length > 0) {
		baseContext.parameters = toSerialisableParameters(args.parameters);
	} else {
		delete baseContext.parameters;
	}

	return Object.keys(baseContext).length > 0
		? JSON.stringify(baseContext)
		: undefined;
}

export function rewriteSql(
	sql: string,
	contextJson?: string
): SqlRewriteResult {
	assertInitialized();
	const result = rewrite_sql_wasm(sql, contextJson ?? null) as unknown;
	const {
		sql: rewrittenSql,
		cacheHints,
		expandedSql,
	} = normalizeRewriteResult(result, sql);
	return {
		rewrittenSql: rewrittenSql,
		expandedSql,
		cacheHints,
	};
}

export function setSqlRewriterContext(contextJson?: string): void {
	pendingContextJson = contextJson ?? null;
	if (!initialized) {
		return;
	}

	set_rewrite_context_wasm(pendingContextJson);
}

/**
 * Generates and installs the serialized context used by the wasm SQL rewriter.
 * Returns the JSON string so callers can reuse it if needed.
 */
export function updateSqlRewriterContext(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): string | undefined {
	const tableCache = getStateCacheV2Tables({ engine });
	const views = getViewSelectMap(engine);

	if (tableCache.size === 0 && views.size === 0) {
		setSqlRewriterContext(undefined);
		return undefined;
	}

	const payload = {
		tableCache: tableCache.size ? Array.from(tableCache) : undefined,
		views: views.size ? Object.fromEntries(views) : undefined,
	};

	const json = JSON.stringify(payload);
	setSqlRewriterContext(json);
	return json;
}

function extractSelectFromCreateView(
	sql: string | null | undefined
): string | undefined {
	if (!sql) {
		return undefined;
	}
	const trimmed = sql.trim();
	if (trimmed === "") {
		return undefined;
	}
	const withoutPrefix = trimmed.replace(/^[\s\S]*?\bAS\b\s*/i, "");
	if (withoutPrefix === trimmed) {
		return undefined;
	}
	let firstStatement = withoutPrefix.trim();
	const semicolonIndex = firstStatement.indexOf(";");
	if (semicolonIndex !== -1) {
		firstStatement = firstStatement.slice(0, semicolonIndex);
	}
	return firstStatement.trim();
}

function getViewSelectMap(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): Map<string, string> {
	const currentVersion = getSchemaVersion(engine.sqlite);
	const cached = viewSelectCache.get(engine.runtimeCacheRef);
	if (cached && cached.schemaVersion === currentVersion) {
		return cached.map;
	}
	const map = loadViewSelectMap(engine.sqlite);
	viewSelectCache.set(engine.runtimeCacheRef, {
		schemaVersion: currentVersion,
		map,
	});
	return map;
}

export type ViewSelectMap = ReturnType<typeof getViewSelectMap>;

function normalizeRewriteResult(
	value: unknown,
	originalSql: string
): { sql: string; cacheHints?: SqlRewriteCacheHints; expandedSql?: string } {
	if (!value || typeof value !== "object") {
		return { sql: originalSql };
	}
	const maybeSql = Reflect.get(value, "sql");
	const sql = typeof maybeSql === "string" ? maybeSql : originalSql;
	const maybeExpanded = Reflect.get(value, "expandedSql");
	const expandedSql =
		typeof maybeExpanded === "string" ? maybeExpanded : undefined;
	const rawHints = Reflect.get(value, "cacheHints");
	const cacheHints = normalizeCacheHints(rawHints);
	return { sql, cacheHints, expandedSql };
}

function normalizeCacheHints(value: unknown): SqlRewriteCacheHints | undefined {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const result: SqlRewriteCacheHints = {};

	const rawInternal = Reflect.get(value, "internalStateVtable");
	if (rawInternal && typeof rawInternal === "object") {
		const schemaKeysValue = Reflect.get(rawInternal, "schemaKeys");
		if (Array.isArray(schemaKeysValue)) {
			const schemaKeys = schemaKeysValue.filter(
				(key): key is string => typeof key === "string"
			);
			if (schemaKeys.length > 0) {
				const includeInheritance = Boolean(
					Reflect.get(rawInternal, "includeInheritance")
				);
				result.internalStateVtable = {
					schemaKeys,
					includeInheritance,
				};
			}
		}
	}

	return Object.keys(result).length > 0 ? result : undefined;
}
