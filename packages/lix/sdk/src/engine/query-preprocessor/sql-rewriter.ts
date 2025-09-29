import initSqlParserWasm, {
	rewrite_sql as rewrite_sql_wasm,
	set_rewrite_context as set_rewrite_context_wasm,
} from "../../../rust/sql-rewriter/pkg/lix_sqlparser.js";
import { getStateCacheV2Tables } from "../../state/cache/schema.js";
import type { LixEngine } from "../boot.js";

export interface InternalStateReaderCacheHints {
	schemaKeys: string[];
	includeInheritance: boolean;
}

export interface SqlRewriteCacheHints {
	internalStateReader?: InternalStateReaderCacheHints;
}

export interface SqlRewriteResult {
	sql: string;
	cacheHints?: SqlRewriteCacheHints;
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

const viewSelectCache = new WeakMap<object, Map<string, string>>();

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
	if (viewSelectCache.has(engine.runtimeCacheRef)) {
		return;
	}
	const map = loadViewSelectMap(engine.sqlite);
	viewSelectCache.set(engine.runtimeCacheRef, map);
}

export async function initializeSqlRewriter(args?: {
	engine?: Pick<LixEngine, "sqlite" | "runtimeCacheRef">;
}): Promise<void> {
	await ensureInitialized();
	if (args?.engine) {
		primeViewSelectCache(args.engine);
	}
}

export function rewriteSql(
	sql: string,
	contextJson?: string
): SqlRewriteResult {
	assertInitialized();
	const result = rewrite_sql_wasm(sql, contextJson ?? null) as unknown;
	const { sql: rewrittenSql, cacheHints } = normalizeRewriteResult(result, sql);
	return {
		sql: rewrittenSql,
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
	return withoutPrefix.replace(/;\s*$/g, "").trim();
}

function getViewSelectMap(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): Map<string, string> {
	const cached = viewSelectCache.get(engine.runtimeCacheRef);
	if (cached) {
		return cached;
	}
	const map = loadViewSelectMap(engine.sqlite);
	viewSelectCache.set(engine.runtimeCacheRef, map);
	return map;
}

export type ViewSelectMap = ReturnType<typeof getViewSelectMap>;

function normalizeRewriteResult(
	value: unknown,
	originalSql: string
): { sql: string; cacheHints?: SqlRewriteCacheHints } {
	if (!value || typeof value !== "object") {
		return { sql: originalSql };
	}
	const maybeSql = Reflect.get(value, "sql");
	const sql = typeof maybeSql === "string" ? maybeSql : originalSql;
	const rawHints = Reflect.get(value, "cacheHints");
	const cacheHints = normalizeCacheHints(rawHints);
	return { sql, cacheHints };
}

function normalizeCacheHints(value: unknown): SqlRewriteCacheHints | undefined {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const result: SqlRewriteCacheHints = {};

	const rawInternal = Reflect.get(value, "internalStateReader");
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
				result.internalStateReader = {
					schemaKeys,
					includeInheritance,
				};
			}
		}
	}


	return Object.keys(result).length > 0 ? result : undefined;
}
