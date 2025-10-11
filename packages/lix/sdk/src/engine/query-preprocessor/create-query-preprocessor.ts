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
		| "sqlite"
		| "hooks"
		| "runtimeCacheRef"
		| "executeSync"
		| "call"
		| "listFunctions"
	>
): Promise<QueryPreprocessorFn> {
	return ({
		sql,
		parameters,
		sideEffects,
	}: QueryPreprocessorArgs): QueryPreprocessorResult => {
		let currentSql = sql;
		let currentParameters: ReadonlyArray<unknown> = parameters;
		let tokens = tokenize(currentSql);
		let kind = detectStatementKind(tokens);
		let rewriteApplied = false;

		const entityViewRewrite = maybeRewriteEntityView({
			engine,
			tokens,
			kind,
			sql: currentSql,
			parameters: currentParameters,
		});
		if (entityViewRewrite) {
			rewriteApplied = true;
			currentSql = entityViewRewrite.sql;
			currentParameters = entityViewRewrite.parameters;
			tokens = tokenize(currentSql);
			kind = detectStatementKind(tokens);
		}

		const triggerRewrite = maybeRewriteTrigger({
			engine,
			sql: currentSql,
			parameters: currentParameters,
			tokens,
			kind,
		});
		if (triggerRewrite) {
			rewriteApplied = true;
			currentSql = triggerRewrite.sql;
			currentParameters = triggerRewrite.parameters;
			tokens = tokenize(currentSql);
			kind = detectStatementKind(tokens);
		}

		const allowStateRewrite = kind === "select" || rewriteApplied;
		if (allowStateRewrite) {
			const stateRewrite = maybeRewriteStateAccess({
				engine,
				sql: currentSql,
				parameters: currentParameters,
				kind,
				sideEffects,
			});
			if (stateRewrite) {
				return stateRewrite;
			}
		}

		if (rewriteApplied) {
			return {
				sql: currentSql,
				parameters: currentParameters,
			};
		}

		return { sql, parameters };
	};
}

/**
 * Routes DML statements through registered INSTEAD OF trigger handlers when available.
 */
const DML_TRIGGER_WHITELIST = new Set(["active_account", "lix_active_account"]);

/**
 * Attempts to rewrite a DML statement by inlining a registered INSTEAD OF trigger body.
 *
 * @example
 * ```ts
 * const rewrite = maybeRewriteTrigger({
 *   engine,
 *   sql: "INSERT INTO active_account (account_id) VALUES (?)",
 *   parameters: ["user123"],
 *   tokens: tokenize("INSERT INTO active_account (account_id) VALUES (?)"),
 *   kind: "insert",
 * });
 * console.log(rewrite?.sql.includes("state_all"));
 * ```
 */
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
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "executeSync"
		| "hooks"
		| "runtimeCacheRef"
		| "call"
		| "listFunctions"
	>;
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
 * Expands view references, refreshes caches, and applies internal vtable rewrites for statements
 * that read from state tables. Supports both top-level SELECT queries and subqueries emitted by
 * entity rewrites.
 *
 * @example
 * ```ts
 * const rewritten = maybeRewriteStateAccess({
 *   engine,
 *   sql: "SELECT * FROM lix_internal_state_vtable",
 *   parameters: [],
 *   kind: "select",
 * });
 * console.log(rewritten?.sql.includes("lix_internal_state_vtable_rewritten"));
 * ```
 */
function maybeRewriteStateAccess(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>;
	sql: string;
	parameters: ReadonlyArray<unknown>;
	kind: StatementKind;
	sideEffects?: boolean;
}): QueryPreprocessorResult | null {
	let currentSql = args.sql;
	let expandedSql: string | undefined;

	const views = getViewSelectMap(args.engine);
	const expansion = expandQuery({
		sql: currentSql,
		views,
		runtimeCacheRef: args.engine.runtimeCacheRef,
	});
	if (expansion.expanded) {
		currentSql = expansion.sql;
		expandedSql = currentSql;
	}

	const tokens = tokenize(currentSql);
	const shapes = analyzeShapes(tokens);

	if (shapes.length === 0) {
		if (args.kind === "select") {
			const includeTransaction = hasOpenTransaction(args.engine);
			const existingCacheTables = getStateCacheV2Tables({
				engine: args.engine,
			});
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

		if (expandedSql) {
			return {
				sql: currentSql,
				parameters: args.parameters,
				expandedSql,
			};
		}

		return null;
	}

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

	const finalSql =
		args.kind === "select"
			? rewrittenSql
			: (collapseDerivedTableTarget(rewrittenSql, args.kind) ?? rewrittenSql);

	return {
		sql: finalSql,
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

function collapseDerivedTableTarget(
	sql: string,
	kind: StatementKind
): string | null {
	if (kind !== "delete") {
		return null;
	}

	const tokens = tokenize(sql);
	let deleteIndex = -1;
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i]?.tokenType === DELETE) {
			deleteIndex = i;
			break;
		}
	}
	if (deleteIndex === -1) {
		return null;
	}

	let fromIndex = -1;
	for (let i = deleteIndex + 1; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token?.image) continue;
		if (token.image.toUpperCase() === "FROM") {
			fromIndex = i;
			break;
		}
	}
	if (fromIndex === -1) {
		return null;
	}

	const openToken = tokens[fromIndex + 1];
	if (!openToken || openToken.image !== "(") {
		return null;
	}

	let depth = 0;
	let closeIndex = -1;
	for (let i = fromIndex + 1; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token?.image) continue;
		if (token.image === "(") {
			depth += 1;
			continue;
		}
		if (token.image === ")") {
			depth -= 1;
			if (depth === 0) {
				closeIndex = i;
				break;
			}
		}
	}

	if (closeIndex === -1) {
		return null;
	}

	let aliasIndex = closeIndex + 1;
	const asToken = tokens[aliasIndex];
	if (asToken?.image?.toUpperCase() === "AS") {
		aliasIndex += 1;
	}
	const aliasToken = tokens[aliasIndex];
	if (!aliasToken || !aliasToken.image) {
		return null;
	}

	const start = openToken.startOffset ?? -1;
	const end = aliasToken.endOffset ?? aliasToken.startOffset ?? -1;
	if (start < 0 || end < start) {
		return null;
	}

	const before = sql.slice(0, start);
	const after = sql.slice(end + 1);
	const needsSpace = before.length > 0 && !/\s$/.test(before);
	const replacement = `${needsSpace ? " " : ""}${aliasToken.image}`;

	return `${before}${replacement}${after}`;
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
