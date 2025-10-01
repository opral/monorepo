import { expandQuery } from "./expand-query.js";
import { ensureFreshStateCache } from "./cache-populator.js";
import { analyzeShape } from "./sql-rewriter/microparser/analyze-shape.js";
import { rewriteSql } from "./sql-rewriter/rewrite-sql.js";
import {
	DELETE,
	INSERT,
	LParen,
	RParen,
	SELECT,
	UPDATE,
	WITH,
	tokenize,
	type Token,
} from "./sql-rewriter/tokenizer.js";
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
		let currentSql = initial.sql;
		let tokens = tokenize(currentSql);
		const kind = detectStatementKind(tokens);
		if (kind !== "select") {
			return {
				sql: currentSql,
				parameters: initial.parameters,
			};
		}

		{
			const views = getViewSelectMap(engine);
			const expansion = expandQuery({
				sql: currentSql,
				views,
				runtimeCacheRef: engine.runtimeCacheRef,
			});
			currentSql = expansion.sql;

			tokens = tokenize(currentSql);
		}

		const shape = analyzeShape(tokens);
		if (shape) {
			ensureFreshStateCache({ engine, shape });
		}

		currentSql = rewriteSql(currentSql, { tokens });

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

function getViewSelectMap(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): Map<string, string> {
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

function getSchemaVersion(sqlite: Pick<LixEngine, "sqlite">["sqlite"]): number {
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
	sqlite: Pick<LixEngine, "sqlite">["sqlite"]
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

type StatementKind = "select" | "insert" | "update" | "delete" | "other";

const ddlGuards = new Set([
	"CREATE",
	"ALTER",
	"DROP",
	"PRAGMA",
	"EXPLAIN",
	"ATTACH",
	"DETACH",
	"VACUUM",
	"ANALYZE",
	"REINDEX",
]);

function detectStatementKind(tokens: Token[]): StatementKind {
	const firstToken = tokens[0];
	if (firstToken) {
		const firstImage = firstToken.image?.toUpperCase();
		if (firstImage && ddlGuards.has(firstImage)) {
			return "other";
		}
	}

	let inCte = false;
	let depth = 0;

	for (const token of tokens) {
		if (!token) continue;

		if (inCte) {
			if (token.tokenType === LParen) {
				depth += 1;
				continue;
			}
			if (token.tokenType === RParen) {
				if (depth > 0) depth -= 1;
				continue;
			}
			const kind = classifyKeyword(token);
			if (kind && kind !== "with" && depth === 0) {
				return kind as StatementKind;
			}
			continue;
		}

		const kind = classifyKeyword(token);
		if (!kind) {
			continue;
		}
		if (kind === "with") {
			inCte = true;
			depth = 0;
			continue;
		}
		return kind as StatementKind;
	}

	return "other";
}

function classifyKeyword(
	token: Token | undefined
): StatementKind | "with" | null {
	if (!token) return null;
	if (token.tokenType === SELECT) return "select";
	if (token.tokenType === INSERT) return "insert";
	if (token.tokenType === UPDATE) return "update";
	if (token.tokenType === DELETE) return "delete";
	if (token.tokenType === WITH) return "with";
	return null;
}
