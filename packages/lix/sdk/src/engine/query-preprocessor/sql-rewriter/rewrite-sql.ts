import { analyzeShapes } from "./microparser/analyze-shape.js";
import {
	buildHoistedInternalStateVtableCte,
	buildInternalStateVtableProjection,
} from "./recipes/rewrite-internal-state-vtable.js";
import { tokenize, type Token } from "./tokenizer.js";

export interface RewriteSqlOptions {
	tokens?: Token[];
	hasOpenTransaction?: boolean;
	existingCacheTables?: Set<string>;
}

export function rewriteSql(sql: string, options?: RewriteSqlOptions): string {
	const normalizedSql = ensureNumberedPlaceholders(sql);
	const tokens = tokenize(normalizedSql);
	const shapes = analyzeShapes(tokens);
	if (shapes.length === 0) {
		return normalizedSql;
	}

	const includeTransaction = options?.hasOpenTransaction !== false;

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

	let current = normalizedSql;
	if (replacements.length > 0) {
		replacements.sort((a, b) => b.start - a.start);
		for (const replacement of replacements) {
			current =
				current.slice(0, replacement.start) +
				replacement.wrapped +
				current.slice(replacement.end + 1);
		}
	}

	const cteClause = buildHoistedInternalStateVtableCte(shapes, {
		includeTransaction,
		existingCacheTables: options?.existingCacheTables,
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

export function ensureNumberedPlaceholders(sql: string): string {
	let result = "";
	let index = 0;
	let paramCounter = 0;
	let inSingle = false;
	let inDouble = false;
	let inBracket = false;
	let inLineComment = false;
	let inBlockComment = false;

	const advance = (count = 1) => {
		result += sql.slice(index, index + count);
		index += count;
	};

	while (index < sql.length) {
		const ch = sql[index]!;
		const next = sql[index + 1];

		if (inLineComment) {
			advance();
			if (ch === "\n") inLineComment = false;
			continue;
		}

		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				advance(2);
				inBlockComment = false;
				continue;
			}
			advance();
			continue;
		}

		if (!inSingle && !inDouble && !inBracket) {
			if (ch === "-" && next === "-") {
				advance(2);
				inLineComment = true;
				continue;
			}
			if (ch === "/" && next === "*") {
				advance(2);
				inBlockComment = true;
				continue;
			}
		}

		if (!inDouble && !inBracket && ch === "'") {
			if (inSingle && next === "'") {
				advance(2); // escaped quote
				continue;
			}
			inSingle = !inSingle;
			advance();
			continue;
		}

		if (!inSingle && !inBracket && ch === '"') {
			if (inDouble && next === '"') {
				advance(2);
				continue;
			}
			inDouble = !inDouble;
			advance();
			continue;
		}

		if (!inSingle && !inDouble && ch === "[" && !inBracket) {
			inBracket = true;
			advance();
			continue;
		}

		if (inBracket) {
			advance();
			if (ch === "]") inBracket = false;
			continue;
		}

		if (!inSingle && !inDouble && !inBracket) {
			if (ch === "?") {
				let j = index + 1;
				while (j < sql.length && /\d/.test(sql[j]!)) {
					j++;
				}
				if (j > index + 1) {
					advance(j - index);
					continue;
				}
				paramCounter += 1;
				result += `?${paramCounter}`;
				index++;
				continue;
			}
		}

		advance();
	}

	return result;
}
