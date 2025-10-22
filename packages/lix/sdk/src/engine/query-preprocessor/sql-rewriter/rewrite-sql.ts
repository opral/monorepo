import { analyzeShapes, type Shape } from "./microparser/analyze-shape.js";
import {
	buildHoistedInternalStateVtableRewrite,
	buildInternalStateVtableProjection,
} from "./recipes/rewrite-internal-state-vtable.js";
import {
	Comma,
	Dot,
	Equals,
	LParen,
	QIdent,
	QMark,
	QMarkNumber,
	RParen,
	SQStr,
	Ident,
	tokenize,
	type Token,
} from "../../sql-parser/tokenizer.js";

const DERIVED_STATE_ALIASES = new Set([
	"state_all",
	"state",
	"state_with_tombstones",
]);

export interface RewriteSqlOptions {
	tokens?: Token[];
	hasOpenTransaction?: boolean;
	existingCacheTables?: Set<string>;
	parameters?: ReadonlyArray<unknown>;
	schemaKeyHints?: readonly string[];
}

export function rewriteSql(sql: string, options?: RewriteSqlOptions): string {
	// const normalizedSql = ensureNumberedPlaceholders(sql);
	const tokens = tokenize(sql);
	const shapes = analyzeShapes(tokens);
	if (shapes.length === 0) {
		return sql;
	}

	const includeTransaction = options?.hasOpenTransaction !== false;
	const schemaKeyHints =
		options?.schemaKeyHints ??
		collectSchemaKeyHints(tokens, shapes, options?.parameters);

	const replacements = shapes
		.map((shape) => {
			const wrapped = buildInternalStateVtableProjection(shape);
			if (!wrapped) return null;
			return {
				start: shape.table.start,
				end: shape.table.end,
				wrapped,
			};
		})
		.filter(
			(value): value is { start: number; end: number; wrapped: string } =>
				value !== null
		);

	let current = sql;
	if (replacements.length > 0) {
		replacements.sort((a, b) => b.start - a.start);
		for (const replacement of replacements) {
			current =
				current.slice(0, replacement.start) +
				replacement.wrapped +
				current.slice(replacement.end + 1);
		}
	}

	const cteClause = buildHoistedInternalStateVtableRewrite(shapes, {
		includeTransaction,
		existingCacheTables: options?.existingCacheTables,
		parameters: options?.parameters,
		schemaKeyHints,
	});
	if (!cteClause) {
		return current;
	}

	return hoistCte(current, cteClause);
}

function hoistCte(sql: string, cteClause: string): string {
	const leadingWhitespaceMatch = sql.match(/^\s*/);
	const leadingWhitespace = leadingWhitespaceMatch
		? (leadingWhitespaceMatch[0] ?? "")
		: "";
	const body = sql.slice(leadingWhitespace.length);
	const withMatch = body.match(/^(with\s+(recursive\s+)?)?/i);
	if (withMatch && withMatch[0]) {
		const header = `${leadingWhitespace}${withMatch[0]}`;
		const remainder = body.slice(withMatch[0].length);
		const needsNewline = !remainder.startsWith("\n");
		const separator = needsNewline ? "\n" : "";
		return `${header}${cteClause},${separator}${remainder}`;
	}

	return `${leadingWhitespace}WITH\n${cteClause}\n${body}`;
}

export function collectSchemaKeyHints(
	tokens: Token[],
	shapes: readonly Shape[],
	parameters?: ReadonlyArray<unknown>
): string[] {
	if (shapes.length !== 1) {
		return [];
	}
	const hints = new Set<string>();
	const allowedAliases = buildAllowedAliasSet(shapes);
	const placeholderOrdinals = buildPlaceholderOrdinalMap(tokens);
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!isSchemaKeyToken(token)) continue;
		const ownerAlias = extractAlias(tokens, i);
		if (
			ownerAlias &&
			allowedAliases.size > 0 &&
			!allowedAliases.has(ownerAlias) &&
			!DERIVED_STATE_ALIASES.has(ownerAlias)
		) {
			continue;
		}
		const opToken = tokens[i + 1];
		if (!opToken) continue;
		if (opToken.tokenType === Equals) {
			const value = resolveSchemaKeyHintValue(
				tokens[i + 2],
				parameters,
				placeholderOrdinals
			);
			if (value) {
				console.error("hint", value);
				hints.add(value);
			}
			continue;
		}
		const opImage = opToken.image?.toLowerCase();
		if (opImage === "in") {
			let j = i + 2;
			if (tokens[j]?.tokenType !== LParen) {
				continue;
			}
			j += 1;
			while (j < tokens.length && tokens[j]?.tokenType !== RParen) {
				const value = resolveSchemaKeyHintValue(
					tokens[j],
					parameters,
					placeholderOrdinals
				);
				if (value) {
					console.error("hint", value);
					hints.add(value);
				}
				j += 1;
				if (tokens[j]?.tokenType === Comma) {
					j += 1;
				}
			}
		}
	}
	return [...hints];
}

function resolveSchemaKeyHintValue(
	token: Token | undefined,
	parameters?: ReadonlyArray<unknown>,
	placeholderOrdinals?: Map<Token, number>
): string | undefined {
	if (!token) return undefined;
	if (token.tokenType === SQStr) {
		return unquoteSingle(token.image);
	}
	if (token.tokenType === Ident) {
		return token.image;
	}
	if (token.tokenType === QIdent) {
		return token.image.slice(1, -1).replace(/""/g, '"');
	}
	if (token.tokenType === QMarkNumber || token.tokenType === QMark) {
		const resolved = resolveParameterPlaceholder(
			token,
			parameters,
			placeholderOrdinals
		);
		if (typeof resolved === "string" && resolved.length > 0) {
			return resolved;
		}
	}
	return undefined;
}

function resolveParameterPlaceholder(
	token: Token | undefined,
	parameters?: ReadonlyArray<unknown>,
	placeholderOrdinals?: Map<Token, number>
): unknown {
	if (!token || !parameters) return undefined;
	const image = token.image;
	if (!image) return undefined;
	if (token.tokenType === QMark) {
		const ordinal = placeholderOrdinals?.get(token);
		if (ordinal && ordinal > 0 && ordinal <= parameters.length) {
			return parameters[ordinal - 1];
		}
		return undefined;
	}
	if (token.tokenType === QMarkNumber || image.startsWith("?")) {
		const index = Number.parseInt(image.slice(1), 10);
		if (!Number.isNaN(index) && index > 0 && index <= parameters.length) {
			return parameters[index - 1];
		}
	}
	return undefined;
}

function isSchemaKeyToken(token: Token | undefined): boolean {
	if (!token) return false;
	const normalized = normalizeIdentifierImage(token);
	return normalized === "schema_key";
}

function normalizeIdentifierImage(token: Token | undefined): string | null {
	if (!token?.image) return null;
	if (token.tokenType === Ident) {
		return token.image.toLowerCase();
	}
	if (token.tokenType === QIdent) {
		return token.image.slice(1, -1).replace(/""/g, '"').toLowerCase();
	}
	return null;
}

function unquoteSingle(image: string): string {
	return image.slice(1, -1).replace(/''/g, "'");
}

function buildAllowedAliasSet(shapes: readonly Shape[]): Set<string> {
	const aliases = new Set<string>();
	for (const shape of shapes) {
		const alias = normalizeAlias(shape.table.aliasSql ?? shape.table.alias);
		if (alias) {
			aliases.add(alias);
		}
	}
	for (const alias of DERIVED_STATE_ALIASES) {
		aliases.add(alias);
	}
	return aliases;
}

function normalizeAlias(value: string | undefined): string | null {
	if (!value) return null;
	if (value.startsWith('"')) {
		return value.slice(1, -1).replace(/""/g, '"').toLowerCase();
	}
	return value.toLowerCase();
}

function extractAlias(tokens: Token[], index: number): string | null {
	const dotToken = tokens[index - 1];
	if (!dotToken || dotToken.tokenType !== Dot) {
		return null;
	}
	const aliasToken = tokens[index - 2];
	if (!aliasToken) return null;
	return normalizeIdentifierImage(aliasToken);
}

function buildPlaceholderOrdinalMap(tokens: Token[]): Map<Token, number> {
	const ordinals = new Map<Token, number>();
	let next = 1;
	for (const token of tokens) {
		if (!token?.image) continue;
		if (token.tokenType === QMark) {
			ordinals.set(token, next);
			next += 1;
			continue;
		}
		if (token.tokenType === QMarkNumber) {
			const parsed = Number.parseInt(token.image.slice(1), 10);
			if (!Number.isNaN(parsed)) {
				ordinals.set(token, parsed);
				next = Math.max(next, parsed + 1);
			}
		}
	}
	return ordinals;
}
