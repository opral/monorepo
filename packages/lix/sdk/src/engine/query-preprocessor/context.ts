import { expandQuery } from "./expand-query.js";
import { getEntityViewSelects } from "./entity-views/selects.js";
import { getSchemaVersion } from "./shared/schema-version.js";
import type { StatementKind } from "./types.js";
import type { LixEngine } from "../boot.js";
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
} from "../sql-parser/tokenizer.js";

export type PreprocessContext = {
	readonly originalSql: string;
	sql: string;
	tokens: Token[];
	kind: StatementKind;
	parameters: ReadonlyArray<unknown>;
	expandedSql?: string;
	rewriteApplied: boolean;
	viewMap?: Map<string, string>;
	sideEffects?: boolean;
	readonly engine: Pick<
		LixEngine,
		| "sqlite"
		| "runtimeCacheRef"
		| "hooks"
		| "executeSync"
		| "call"
		| "listFunctions"
	>;
};

export type RewritePayload = {
	sql: string;
	parameters: ReadonlyArray<unknown>;
};

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

/**
 * Determines the statement kind represented by the provided token stream.
 */
export function detectStatementKind(tokens: Token[]): StatementKind {
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

/**
 * Builds a preprocessing context seeded with the original SQL and parameters.
 */
export function createPreprocessContext(args: {
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "runtimeCacheRef"
		| "hooks"
		| "executeSync"
		| "call"
		| "listFunctions"
	>;
	sql: string;
	parameters: ReadonlyArray<unknown>;
	sideEffects?: boolean;
}): PreprocessContext {
	const context: PreprocessContext = {
		originalSql: args.sql,
		sql: args.sql,
		tokens: [],
		kind: "other",
		parameters: args.parameters,
		rewriteApplied: false,
		engine: args.engine,
		sideEffects: args.sideEffects,
	};
	retokenizeContext(context);
	return context;
}

/**
 * Applies rewritten SQL and parameters to the context while refreshing tokens.
 */
export function applyRewriteResult(
	context: PreprocessContext,
	rewrite: RewritePayload
): void {
	context.sql = rewrite.sql;
	context.parameters = rewrite.parameters;
	context.rewriteApplied = true;
	context.expandedSql = undefined;
	retokenizeContext(context);
}

/**
 * Expands registered views and updates the context SQL in place.
 */
export function expandContextSql(context: PreprocessContext): void {
	if (!context.viewMap) {
		context.viewMap = getViewSelectMap(context.engine);
	}
	const expansion = expandQuery({
		sql: context.sql,
		views: context.viewMap,
		runtimeCacheRef: context.engine.runtimeCacheRef,
	});
	context.sql = expansion.sql;
	context.expandedSql = expansion.expanded ? expansion.sql : undefined;
	retokenizeContext(context);
}

function retokenizeContext(context: PreprocessContext): void {
	context.tokens = tokenize(context.sql);
	context.kind = detectStatementKind(context.tokens);
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

type ViewCacheEntry = {
	schemaVersion: number;
	entitySignature: string;
	map: Map<string, string>;
};

let viewCache = new WeakMap<object, ViewCacheEntry>();

function getViewSelectMap(
	engine: Pick<
		LixEngine,
		"sqlite" | "runtimeCacheRef" | "hooks" | "executeSync"
	>
): Map<string, string> {
	const currentVersion = getSchemaVersion(engine.sqlite);
	const { map: entityViews, signature: entitySignature } = getEntityViewSelects(
		{
			engine,
		}
	);
	const cached = viewCache.get(engine.runtimeCacheRef);
	if (
		cached &&
		cached.schemaVersion === currentVersion &&
		cached.entitySignature === entitySignature
	) {
		return cached.map;
	}

	const map = loadViewSelectMap(engine.sqlite);
	for (const [name, sql] of entityViews) {
		map.set(name, sql);
	}
	viewCache.set(engine.runtimeCacheRef, {
		schemaVersion: currentVersion,
		entitySignature,
		map,
	});
	return map;
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
