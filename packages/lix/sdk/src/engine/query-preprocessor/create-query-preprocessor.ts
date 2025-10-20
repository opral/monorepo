import { expandQuery } from "./expand-query.js";
import { ensureFreshStateCache } from "./cache-populator.js";
import { analyzeShapes } from "./sql-rewriter/microparser/analyze-shape.js";
import {
	collectSchemaKeyHints,
	rewriteSql,
} from "./sql-rewriter/rewrite-sql.js";
import { ensureNumberedPlaceholders } from "./sql-rewriter/ensure-numbered-placeholders.js";
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
	AtName,
	ColonName,
	Comma,
	DELETE,
	DollarName,
	DollarNumber,
	Equals,
	Ident,
	INSERT,
	LParen,
	QIdent,
	QMark,
	QMarkNumber,
	RParen,
	SELECT,
	SQStr,
	UPDATE,
	WITH,
	tokenize,
	type Token,
} from "../sql-parser/tokenizer.js";
import type { LixEngine } from "../boot.js";
import { hasOpenTransaction } from "../../state/vtable/vtable.js";
import {
	applyStateCacheSchema,
	getStateCacheTables,
} from "../../state/cache/schema.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../../state/cache/create-schema-cache-table.js";
import { resolveCacheSchemaDefinition } from "../../state/cache/schema-resolver.js";
import { getEntityViewSelects } from "./entity-views/selects.js";
import {
	readDmlTarget,
	type DmlOperation,
} from "./dml-trigger/read-dml-target.js";

export function createQueryPreprocessor(
	engine: Pick<
		LixEngine,
		| "sqlite"
		| "hooks"
		| "runtimeCacheRef"
		| "executeSync"
		| "call"
		| "listFunctions"
	>
): QueryPreprocessorFn {
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
			sideEffects,
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
// We currently skip DML trigger rewrites. Mutations are not a bottleneck, and the
// preprocessor primarily optimizes reads. Retain a commented whitelist in case we
// revisit trigger inlining.
// const DML_TRIGGER_WHITELIST = new Set([
// 	"active_account",
// 	"lix_active_account",
// 	"state",
// ]);

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
	sideEffects?: boolean;
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
	// Mutation rewrites are currently disabled; we only optimize SELECT queries.
	return null;

	// return (
	// 	maybeRewriteInsteadOfTrigger({
	// 		engine: args.engine,
	// 		sql: args.sql,
	// 		tokens: args.tokens,
	// 		parameters: args.parameters,
	// 		op,
	// 	}) ?? null
	// );
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
			const existingCacheTables = getStateCacheTables({
				engine: args.engine,
			});
			const rewrittenSql = rewriteSql(currentSql, {
				tokens,
				hasOpenTransaction: includeTransaction,
				existingCacheTables,
				parameters: args.parameters,
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

	const schemaKeyHints = collectSchemaKeyHints(tokens, shapes, args.parameters);
	const allowSchemaHints =
		shapes.every((shape) => shape.schemaKeys.length > 0) ||
		shapes.some((shape) =>
			shape.schemaKeys.some((entry) => entry.kind === "placeholder")
		) ||
		hasSchemaKeyPlaceholderPredicate(tokens);
	const existingCacheTables = getStateCacheTables({ engine: args.engine });
	ensureDescriptorCacheTable({
		engine: args.engine,
		cacheTables: existingCacheTables,
	});
	if (args.sideEffects !== false) {
		for (const shape of shapes) {
			ensureFreshStateCache({
				engine: args.engine,
				shape,
				parameters: args.parameters,
				schemaKeyHints: allowSchemaHints ? schemaKeyHints : undefined,
			});
		}
	}

	const includeTransaction = hasOpenTransaction(args.engine);
	const rewrittenSql = rewriteSql(currentSql, {
		tokens,
		hasOpenTransaction: includeTransaction,
		existingCacheTables,
		parameters: args.parameters,
		schemaKeyHints:
			args.kind === "select" && allowSchemaHints ? schemaKeyHints : [],
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

const PLACEHOLDER_TOKEN_TYPES = new Set([
	QMark,
	QMarkNumber,
	ColonName,
	DollarName,
	DollarNumber,
	AtName,
]);

function hasSchemaKeyPlaceholderPredicate(tokens: Token[]): boolean {
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) continue;
		if (normalizeIdentifier(token) !== "schema_key") {
			continue;
		}
		const op = tokens[i + 1];
		if (!op) continue;
		if (op.tokenType === Equals) {
			const valueToken = tokens[i + 2];
			if (valueToken && PLACEHOLDER_TOKEN_TYPES.has(valueToken.tokenType)) {
				return true;
			}
			continue;
		}
		if (op.image?.toLowerCase() === "in") {
			let j = i + 2;
			if (tokens[j]?.tokenType !== LParen) continue;
			j += 1;
			while (j < tokens.length && tokens[j]?.tokenType !== RParen) {
				const valueToken = tokens[j];
				if (valueToken && PLACEHOLDER_TOKEN_TYPES.has(valueToken.tokenType)) {
					return true;
				}
				j += 1;
				if (tokens[j]?.tokenType === Comma) {
					j += 1;
				}
			}
		}
	}
	return false;
}

function normalizeIdentifier(token: Token | undefined): string | null {
	if (!token?.image) return null;
	const image = token.image;
	if (token.tokenType === Ident) {
		return image.toLowerCase();
	}
	if (token.tokenType === QIdent) {
		return image.slice(1, -1).replace(/""/g, '"').toLowerCase();
	}
	return image.toLowerCase();
}

function ensureDescriptorCacheTable(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	cacheTables: Set<string>;
}): void {
	const descriptorTable = schemaKeyToCacheTableName("lix_version_descriptor");
	if (args.cacheTables.has(descriptorTable)) {
		return;
	}
	const schemaDefinition = resolveCacheSchemaDefinition({
		engine: args.engine,
		schemaKey: "lix_version_descriptor",
	});
	if (!schemaDefinition) {
		throw new Error("Missing schema definition for lix_version_descriptor");
	}
	const created = createSchemaCacheTable({
		engine: args.engine,
		schema: schemaDefinition,
	});
	args.cacheTables.add(created);
	if (created !== descriptorTable) {
		args.cacheTables.add(descriptorTable);
	}
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
