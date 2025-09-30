import { expandQuery } from "./expand-query.js";
import { ensureFreshStateCache } from "./cache-populator.js";
import { analyzeShape } from "./sql-rewriter/microparser/analyze-shape.js";
import { rewriteSql } from "./sql-rewriter/rewrite-sql.js";
import { tokenize, type Token } from "./sql-rewriter/tokenizer.js";
import type {
	QueryPreprocessorResult,
	QueryPreprocessorStage,
} from "./create-query-preprocessor.js";
import type { LixEngine } from "../boot.js";

export async function createQueryPreprocessorV2(
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>
): Promise<QueryPreprocessorStage> {
	return (initial: QueryPreprocessorResult): QueryPreprocessorResult => {
		const trimmed = initial.sql.trimStart();
		const lower = trimmed.toLowerCase();
		const shouldProcess =
			lower.startsWith("select") || lower.startsWith("with");

		let currentSql = initial.sql;
		let tokens: Token[] | undefined;

		if (shouldProcess) {
			const views = getViewSelectMap(engine);
			const expansion = expandQuery({ sql: currentSql, views });
			currentSql = expansion.sql;

			tokens = tokenize(currentSql);
			const shape = analyzeShape(tokens);
			if (shape) {
				ensureFreshStateCache({ engine, shape });
			}

			currentSql = rewriteSql(currentSql, { tokens });
		}

		const context: QueryPreprocessorResult = {
			sql: currentSql,
			parameters: initial.parameters,
		};

		return context;
	};
}

type ViewCacheEntry = {
	schemaVersion: number;
	map: Map<string, string>;
};

const viewCache = new WeakMap<object, ViewCacheEntry>();

function getViewSelectMap(engine: EngineContext): Map<string, string> {
	const currentVersion = getSchemaVersion(engine.sqlite);
	const cached = viewCache.get(engine.runtimeCacheRef);
	if (cached && cached.schemaVersion === currentVersion) {
		return cached.map;
	}

	const map = loadViewSelectMap(engine.sqlite);
	viewCache.set(engine.runtimeCacheRef, {
		schemaVersion: currentVersion,
		map,
	});
	return map;
}

function getSchemaVersion(sqlite: EngineContext["sqlite"]): number {
	const result = sqlite.exec({
		sql: "PRAGMA schema_version;",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});
	const rows = result as Array<Record<string, unknown>>;
	const value = rows[0]?.schema_version;
	if (typeof value === "number") return value;
	if (typeof value === "bigint") return Number(value);
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
}

function loadViewSelectMap(
	sqlite: EngineContext["sqlite"]
): Map<string, string> {
	const result = sqlite.exec({
		sql: "SELECT name, sql FROM sqlite_schema WHERE type = 'view' AND sql IS NOT NULL",
		returnValue: "resultRows",
		rowMode: "object",
		columnNames: [],
	});

	const map = new Map<string, string>();
	for (const row of result as Array<Record<string, unknown>>) {
		const name = typeof row.name === "string" ? row.name : undefined;
		const sqlText = typeof row.sql === "string" ? row.sql : undefined;
		if (!name || !sqlText) continue;
		const selectSql = extractSelectFromCreateView(sqlText);
		if (!selectSql) continue;
		map.set(name, selectSql);
	}
	return map;
}

function extractSelectFromCreateView(sql: string): string | undefined {
	const trimmed = sql.trim();
	if (!trimmed) return undefined;
	const withoutPrefix = trimmed.replace(/^[\s\S]*?\bAS\b\s*/i, "");
	if (withoutPrefix === trimmed) return undefined;
	let statement = withoutPrefix.trim();
	const semicolon = statement.indexOf(";");
	if (semicolon !== -1) {
		statement = statement.slice(0, semicolon);
	}
	return statement.trim() || undefined;
}
