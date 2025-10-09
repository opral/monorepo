import { expandQuery } from "./expand-query.js";
import { ensureFreshStateCache } from "./cache-populator.js";
import { analyzeShapes } from "./sql-rewriter/microparser/analyze-shape.js";
import { rewriteSql } from "./sql-rewriter/rewrite-sql.js";
import { rewriteEntityInsert } from "./entity-views/insert.js";
import { rewriteEntityUpdate } from "./entity-views/update.js";
import { rewriteEntityDelete } from "./entity-views/delete.js";
import { getSchemaVersion } from "./shared/schema-version.js";
import type {
	QueryPreprocessorArgs,
	QueryPreprocessorFn,
	QueryPreprocessorResult,
	StatementKind,
} from "./types.js";
export type {
	QueryPreprocessorArgs,
	QueryPreprocessorFn,
	QueryPreprocessorResult,
} from "./types.js";
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
import type { LixEngine } from "../boot.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import { getStateCacheV2Tables } from "../../state/cache/schema.js";
import { getEntityViewSelects } from "./entity-views/selects.js";
import { maybeRewriteInsteadOfTrigger } from "./dml-trigger/rewrite.js";
import {
	readDmlTarget,
	type DmlOperation,
} from "./dml-trigger/read-dml-target.js";

export async function createQueryPreprocessor(
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>
): Promise<QueryPreprocessorFn> {
	return ({
		sql,
		parameters,
		sideEffects,
	}: QueryPreprocessorArgs): QueryPreprocessorResult => {
		const tokens = tokenize(sql);
		const kind = detectStatementKind(tokens);

		const entityViewRewrite = maybeRewriteEntityView({
			engine,
			sql,
			parameters,
			tokens,
			kind,
		});
		if (entityViewRewrite) {
			return entityViewRewrite;
		}

		// const triggerRewrite = maybeRewriteTrigger({
		// 	engine,
		// 	sql,
		// 	parameters,
		// 	tokens,
		// 	kind,
		// });
		// if (triggerRewrite) {
		// 	return triggerRewrite;
		// }

		const vtableRewrite = maybeRewriteVtable({
			engine,
			sql,
			parameters,
			tokens,
			kind,
			sideEffects,
		});
		if (vtableRewrite) {
			return vtableRewrite;
		}

		return { sql, parameters };
	};
}

/**
 * Routes DML statements through registered INSTEAD OF trigger handlers when available.
 */
const DML_TRIGGER_WHITELIST = new Set(["active_account", "lix_active_account"]);

function maybeRewriteTrigger(args: {
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef" | "executeSync">;
	sql: string;
	parameters: ReadonlyArray<unknown>;
	tokens: Token[];
	kind: StatementKind;
}): QueryPreprocessorResult | null {
	if (
		args.kind !== "insert" &&
		args.kind !== "update" &&
		args.kind !== "delete"
	) {
		return null;
	}

	const op: DmlOperation =
		args.kind === "insert"
			? "insert"
			: args.kind === "update"
				? "update"
				: "delete";

	const target = readDmlTarget(args.tokens, op);
	if (!target) {
		return null;
	}
	const normalizedTarget = target.toLowerCase();
	if (!DML_TRIGGER_WHITELIST.has(normalizedTarget)) {
		return null;
	}

	return (
		maybeRewriteInsteadOfTrigger({
			engine: args.engine,
			sql: args.sql,
			tokens: args.tokens,
			parameters: args.parameters,
			op,
		}) ?? null
	);
}

/**
 * Rewrites entity view mutations to operate directly on the state views.
 */
function maybeRewriteEntityView(args: {
	engine: Pick<LixEngine, "sqlite" | "executeSync">;
	sql: string;
	parameters: ReadonlyArray<unknown>;
	tokens: Token[];
	kind: StatementKind;
}): QueryPreprocessorResult | null {
	if (
		args.kind !== "insert" &&
		args.kind !== "update" &&
		args.kind !== "delete"
	) {
		return null;
	}

	if (args.kind === "insert") {
		return (
			rewriteEntityInsert({
				sql: args.sql,
				tokens: args.tokens,
				parameters: args.parameters,
				engine: args.engine,
			}) ?? null
		);
	}

	if (args.kind === "update") {
		return (
			rewriteEntityUpdate({
				sql: args.sql,
				tokens: args.tokens,
				parameters: args.parameters,
				engine: args.engine,
			}) ?? null
		);
	}

	return (
		rewriteEntityDelete({
			sql: args.sql,
			tokens: args.tokens,
			parameters: args.parameters,
			engine: args.engine,
		}) ?? null
	);
}

/**
 * Expands view references, refreshes caches, and applies internal vtable rewrites for SELECTs.
 */
function maybeRewriteVtable(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>;
	sql: string;
	parameters: ReadonlyArray<unknown>;
	tokens: Token[];
	kind: StatementKind;
	sideEffects?: boolean;
}): QueryPreprocessorResult | null {
	if (args.kind !== "select") {
		return null;
	}

	let currentSql = args.sql;
	let expandedSql: string | undefined;
	let tokens = args.tokens;

	const views = getViewSelectMap(args.engine);
	const expansion = expandQuery({
		sql: currentSql,
		views,
		runtimeCacheRef: args.engine.runtimeCacheRef,
	});
	if (expansion.expanded) {
		currentSql = expansion.sql;
		expandedSql = currentSql;
		tokens = tokenize(currentSql);
	}

	const shapes = analyzeShapes(tokens);
	const existingCacheTables = getStateCacheV2Tables({ engine: args.engine });
	if (args.sideEffects !== false) {
		for (const shape of shapes) {
			ensureFreshStateCache({ engine: args.engine, shape });
		}
	}

	const includeTransaction = hasOpenTransaction(args.engine);
	const rewrittenSql = rewriteSql(currentSql, {
		tokens,
		hasOpenTransaction: includeTransaction,
		existingCacheTables,
	});

	return {
		sql: rewrittenSql,
		parameters: args.parameters,
		expandedSql,
	};
}

type ViewCacheEntry = {
	schemaVersion: number;
	entitySignature: string;
	map: Map<string, string>;
};

const viewCache = new WeakMap<object, ViewCacheEntry>();

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
