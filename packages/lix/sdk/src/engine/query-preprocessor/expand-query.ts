import { findTableFactor } from "./sql-rewriter/microparser/table-factor.js";
import { tokenize } from "./sql-rewriter/tokenizer.js";

export interface ExpandQueryArgs {
	sql: string;
	views: Map<string, string>;
}

export interface ExpandQueryResult {
	sql: string;
	expanded: boolean;
}

interface NormalizedView {
	name: string;
	sql: string;
}

const lower = (value: string): string => value.toLowerCase();

export function expandQuery(args: ExpandQueryArgs): ExpandQueryResult {
	if (args.views.size === 0) {
		return { sql: args.sql, expanded: false };
	}

	const normalizedViews = new Map<string, NormalizedView>();
	for (const [name, sql] of args.views) {
		normalizedViews.set(lower(name), { name, sql });
	}

	const blocked = new Set<string>();
	const memo = new Map<string, string | null>();

	const containsViewReference = (sql: string, viewKey: string): boolean => {
		const tokens = tokenize(sql);
		return findTableFactor(tokens, viewKey) !== null;
	};

	const resolveView = (
		viewKey: string,
		stack: Set<string>
	): string | null => {
		if (blocked.has(viewKey)) {
			return null;
		}
		const cached = memo.get(viewKey);
		if (cached !== undefined) {
			return cached;
		}

		if (stack.has(viewKey)) {
			blocked.add(viewKey);
			memo.set(viewKey, null);
			return null;
		}

		const entry = normalizedViews.get(viewKey);
		if (!entry) {
			return null;
		}

		const nextStack = new Set(stack);
		nextStack.add(viewKey);
		const expanded = expandSqlBody(entry.sql, nextStack);

		if (containsViewReference(expanded.sql, viewKey)) {
			blocked.add(viewKey);
			memo.set(viewKey, null);
			return null;
		}

		memo.set(viewKey, expanded.sql);
		return expanded.sql;
	};

	const expandSqlBody = (
		inputSql: string,
		stack: Set<string>
	): { sql: string; changed: boolean } => {
		let current = inputSql;
		let changed = false;

		while (true) {
			const tokens = tokenize(current);
			let bestMatch: {
				viewKey: string;
				start: number;
				end: number;
				aliasSql: string;
			} | null = null;

			for (const [viewKey] of normalizedViews) {
				if (stack.has(viewKey) || blocked.has(viewKey)) {
					continue;
				}
				const match = findTableFactor(tokens, viewKey);
				if (!match) {
					continue;
				}
				if (
					!bestMatch ||
					match.start < bestMatch.start
				) {
					bestMatch = {
						viewKey,
						start: match.start,
						end: match.end,
						aliasSql: match.aliasSql ?? match.alias,
					};
				}
			}

			if (!bestMatch) {
				break;
			}

			const resolved = resolveView(bestMatch.viewKey, stack);
			if (!resolved) {
				blocked.add(bestMatch.viewKey);
				continue;
			}

			const inner = resolved.trim();
			const replacement = `( ${inner} ) AS ${bestMatch.aliasSql}`;
			current =
				current.slice(0, bestMatch.start) +
				replacement +
				current.slice(bestMatch.end + 1);
			changed = true;
		}

		return { sql: current, changed };
	};

	const topLevel = expandSqlBody(args.sql, new Set());
	if (!topLevel.changed) {
		return { sql: args.sql, expanded: false };
	}
	return { sql: topLevel.sql, expanded: true };
}
