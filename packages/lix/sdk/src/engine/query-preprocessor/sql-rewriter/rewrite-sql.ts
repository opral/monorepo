import { analyzeShapes } from "./microparser/analyze-shape.js";
import {
	buildHoistedInternalStateVtableCte,
	buildInternalStateVtableProjection,
} from "./recipes/rewrite-internal-state-vtable.js";
import { tokenize, type Token } from "./tokenizer.js";

export interface RewriteSqlOptions {
	tokens?: Token[];
	hasOpenTransaction?: boolean;
}

export function rewriteSql(sql: string, options?: RewriteSqlOptions): string {
	const tokens = options?.tokens ?? tokenize(sql);
	const shapes = analyzeShapes(tokens);
	if (shapes.length === 0) {
		return sql;
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

	const cteClause = buildHoistedInternalStateVtableCte(shapes, {
		includeTransaction,
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
