import { expandContextSql } from "../context.js";
import {
	collectSchemaKeyHints,
	rewriteSql,
} from "../sql-rewriter/rewrite-sql.js";
import { analyzeShapes } from "../sql-rewriter/microparser/analyze-shape.js";
import { ensureFreshStateCache } from "../cache-populator.js";
import {
	applyStateCacheSchema,
	getStateCacheTables,
} from "../../../state/cache/schema.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../../../state/cache/create-schema-cache-table.js";
import { resolveCacheSchemaDefinition } from "../../../state/cache/schema-resolver.js";
import { hasOpenTransaction } from "../../../state/vtable/vtable.js";
import type { PreprocessorStep } from "./types.js";
import {
	AtName,
	ColonName,
	Comma,
	DELETE,
	DollarName,
	DollarNumber,
	Equals,
	Ident,
	LParen,
	QIdent,
	QMark,
	QMarkNumber,
	RParen,
	tokenize,
	type Token,
} from "../../sql-parser/tokenizer.js";
import type { PreprocessContext } from "../context.js";
import type { QueryPreprocessorResult } from "../types.js";
import type { LixEngine } from "../../boot.js";

export const stateAccessStep: PreprocessorStep = (context) => {
	if (context.kind !== "select" && !context.rewriteApplied) {
		return null;
	}
	expandContextSql(context);
	return maybeRewriteStateAccess(context);
};

function maybeRewriteStateAccess(
	context: PreprocessContext
): QueryPreprocessorResult | null {
	const currentSql = context.sql;
	const tokens = context.tokens;
	const kind = context.kind;
	const shapes = analyzeShapes(tokens);
	const engine = context.engine;

	if (shapes.length === 0) {
		if (kind === "select") {
			const includeTransaction = hasOpenTransaction(engine);
			const existingCacheTables = getStateCacheTables({ engine });
			const rewrittenSql = rewriteSql(currentSql, {
				hasOpenTransaction: includeTransaction,
				existingCacheTables,
				parameters: context.parameters,
			});

			return {
				sql: rewrittenSql,
				parameters: context.parameters,
				expandedSql: context.expandedSql,
			};
		}

		if (context.expandedSql) {
			return {
				sql: currentSql,
				parameters: context.parameters,
				expandedSql: context.expandedSql,
			};
		}

		return null;
	}

	applyStateCacheSchema({ engine });
	const schemaKeyHints = collectSchemaKeyHints(
		tokens,
		shapes,
		context.parameters
	);
	const allowSchemaHints =
		shapes.every((shape) => shape.schemaKeys.length > 0) ||
		shapes.some((shape) =>
			shape.schemaKeys.some((entry) => entry.kind === "placeholder")
		) ||
		hasSchemaKeyPlaceholderPredicate(tokens);
	const existingCacheTables = getStateCacheTables({ engine });
	ensureDescriptorCacheTable({
		engine,
		cacheTables: existingCacheTables,
	});
	if (context.sideEffects !== false) {
		for (const shape of shapes) {
			ensureFreshStateCache({
				engine,
				shape,
				parameters: context.parameters,
				schemaKeyHints: allowSchemaHints ? schemaKeyHints : undefined,
			});
		}
	}

	const includeTransaction = hasOpenTransaction(engine);
	const rewrittenSql = rewriteSql(currentSql, {
		hasOpenTransaction: includeTransaction,
		existingCacheTables,
		parameters: context.parameters,
		schemaKeyHints: kind === "select" && allowSchemaHints ? schemaKeyHints : [],
	});

	const finalSql =
		kind === "select"
			? rewrittenSql
			: (collapseDerivedTableTarget(rewrittenSql, kind) ?? rewrittenSql);

	return {
		sql: finalSql,
		parameters: context.parameters,
		expandedSql: context.expandedSql,
	};
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

function collapseDerivedTableTarget(
	sql: string,
	kind: PreprocessContext["kind"]
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
