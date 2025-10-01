import { analyzeShape } from "./microparser/analyze-shape.js";
import type { TableFactorMatch } from "./microparser/table-factor.js";
import { rewriteInternalStateVtableQuery } from "./recipes/rewrite-internal-state-vtable.js";
import { Ident, QIdent, tokenize, type Token } from "./tokenizer.js";

export interface RewriteSqlOptions {
	tokens?: Token[];
}

export function rewriteSql(sql: string, options?: RewriteSqlOptions): string {
	const tokens = options?.tokens ?? tokenize(sql);
	const shape = analyzeShape(tokens);
	if (!shape) {
		return sql;
	}

	const replacementSql = rewriteInternalStateVtableQuery(shape);
	if (!replacementSql) {
		return sql;
	}

	const aliasSql = determineAliasSql(shape.table);
	const wrapped = `(${replacementSql}) AS ${aliasSql}`;

	const edits = collectEdits({ tokens, table: shape.table, aliasSql, wrapped });

	return applyEdits(sql, edits);
}

type Edit = { start: number; end: number; text: string };

function collectEdits(args: {
	tokens: Token[];
	table: TableFactorMatch;
	aliasSql: string;
	wrapped: string;
}): Edit[] {
	const { tokens, table, aliasSql, wrapped } = args;
	const edits: Edit[] = [];

	const tableStart = table.start;
	const tableEnd = table.end;

	edits.push({
		start: tableStart,
		end: tableEnd,
		text: wrapped,
	});

	for (const token of tokens) {
		if (!isIdentifier(token)) continue;
		if (!isInternalStateVtableToken(token)) continue;
		const tokenStart = token.startOffset ?? 0;
		const tokenEnd = token.endOffset ?? tokenStart;
		if (tokenStart >= tableStart && tokenEnd <= tableEnd) {
			continue;
		}
		edits.push({
			start: tokenStart,
			end: tokenEnd,
			text: aliasSql,
		});
	}

	return edits;
}

function applyEdits(sql: string, edits: Edit[]): string {
	if (edits.length === 0) return sql;
	edits.sort((a, b) => b.start - a.start);
	let output = sql;
	for (const edit of edits) {
		output =
			output.slice(0, edit.start) + edit.text + output.slice(edit.end + 1);
	}
	return output;
}

function determineAliasSql(table: TableFactorMatch): string {
	if (table.explicitAlias) {
		return table.aliasSql ?? table.alias;
	}
	return "internal_state_vtable_rewritten";
}

function isIdentifier(token: Token | undefined): token is Token {
	if (!token) return false;
	return token.tokenType === Ident || token.tokenType === QIdent;
}

function isInternalStateVtableToken(token: Token): boolean {
	const normalized = normalizeIdentifier(token.image);
	return normalized === "internal_state_vtable";
}

function normalizeIdentifier(image: string): string {
	if (!image) return image;
	if (image.startsWith('"') && image.endsWith('"')) {
		return image.slice(1, -1).replace(/""/g, "").toLowerCase();
	}
	return image.toLowerCase();
}
