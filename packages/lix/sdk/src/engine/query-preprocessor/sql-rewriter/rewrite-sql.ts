import { analyzeShapes } from "./microparser/analyze-shape.js";
import { rewriteInternalStateVtableQuery } from "./recipes/rewrite-internal-state-vtable.js";
import { tokenize, type Token } from "./tokenizer.js";

export interface RewriteSqlOptions {
	tokens?: Token[];
}

export function rewriteSql(sql: string, options?: RewriteSqlOptions): string {
	const tokens = options?.tokens ?? tokenize(sql);
	const shapes = analyzeShapes(tokens);
	if (shapes.length === 0) {
		return sql;
	}

	const replacements = shapes
		.map((shape) => {
			const replacementSql = rewriteInternalStateVtableQuery(shape);
			if (!replacementSql) return null;
			const aliasSql = shape.table.aliasSql ?? shape.table.alias;
			const wrapped = `(${replacementSql}) AS ${aliasSql}`;
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

	if (replacements.length === 0) {
		return sql;
	}

	replacements.sort((a, b) => b.start - a.start);
	let current = sql;
	for (const replacement of replacements) {
		current =
			current.slice(0, replacement.start) +
			replacement.wrapped +
			current.slice(replacement.end + 1);
	}
	return current;
}
