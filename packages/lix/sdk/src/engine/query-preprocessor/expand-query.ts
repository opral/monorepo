import { findTableFactor } from "./sql-rewriter/microparser/table-factor.js";
import {
	tokenize,
	Ident,
	QIdent,
	type Token,
} from "../sql-parser/tokenizer.js";
import { normalizeIdentifier } from "./shared/schema-version.js";

export interface ExpandQueryArgs {
	sql: string;
	views: Map<string, string>;
	runtimeCacheRef: object;
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

type CacheEntry = {
	source: Map<string, string>;
	views: Map<string, NormalizedView>;
	expandedViews: Map<string, string>;
	statementCache: Map<string, ExpandQueryResult>;
};

const globalViewCache = new WeakMap<object, CacheEntry>();

export function expandQuery(args: ExpandQueryArgs): ExpandQueryResult {
	if (args.views.size === 0) {
		return { sql: args.sql, expanded: false };
	}

	const cacheEntry = getOrCreateCacheEntry(args.runtimeCacheRef, args.views);
	const normalizedViews = cacheEntry.views;
	const cachedStatement = cacheEntry.statementCache.get(args.sql);
	if (cachedStatement) {
		return cachedStatement;
	}

	const context: ExpandContext = {
		normalizedViews,
		expandedViewCache: cacheEntry.expandedViews,
		memo: new Map(),
		blocked: new Set(),
	};

	const topLevel = expandSqlBody(args.sql, new Set(), context);
	const finalResult: ExpandQueryResult = topLevel.changed
		? { sql: topLevel.sql, expanded: true }
		: { sql: args.sql, expanded: false };

	cacheEntry.statementCache.set(args.sql, finalResult);
	return finalResult;
}

interface ExpandContext {
	normalizedViews: Map<string, NormalizedView>;
	expandedViewCache: Map<string, string>;
	memo: Map<string, string | null>;
	blocked: Set<string>;
}

function getOrCreateCacheEntry(
	runtimeCacheRef: object,
	views: Map<string, string>
): CacheEntry {
	const cached = globalViewCache.get(runtimeCacheRef);
	if (cached && cached.source === views) {
		return cached;
	}

	const normalized = new Map<string, NormalizedView>();
	for (const [name, sql] of views) {
		normalized.set(lower(name), { name, sql });
	}

	const entry: CacheEntry = {
		source: views,
		views: normalized,
		expandedViews: new Map(),
		statementCache: new Map(),
	};
	globalViewCache.set(runtimeCacheRef, entry);
	return entry;
}

function expandSqlBody(
	inputSql: string,
	stack: Set<string>,
	context: ExpandContext
): { sql: string; changed: boolean } {
	let current = inputSql;
	let changed = false;

	while (true) {
		const tokens = tokenize(current);
		const candidateKeys = collectCandidateViewKeys(
			tokens,
			context.normalizedViews
		);
		let bestMatch: {
			viewKey: string;
			start: number;
			end: number;
			aliasSql: string;
		} | null = null;

		for (const viewKey of candidateKeys) {
			if (stack.has(viewKey) || context.blocked.has(viewKey)) {
				continue;
			}
			const match = findTableFactor(tokens, viewKey);
			if (!match) {
				continue;
			}
			if (!bestMatch || match.start < bestMatch.start) {
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

		const resolved = resolveView(bestMatch.viewKey, stack, context);
		if (!resolved) {
			context.blocked.add(bestMatch.viewKey);
			continue;
		}
		if (!/\blix_internal_state_vtable\b/i.test(resolved)) {
			context.blocked.add(bestMatch.viewKey);
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
}

function resolveView(
	viewKey: string,
	stack: Set<string>,
	context: ExpandContext
): string | null {
	const cachedExpanded = context.expandedViewCache.get(viewKey);
	if (cachedExpanded) {
		return cachedExpanded;
	}
	if (context.blocked.has(viewKey)) {
		return null;
	}
	const memoized = context.memo.get(viewKey);
	if (memoized !== undefined) {
		return memoized;
	}

	if (stack.has(viewKey)) {
		context.blocked.add(viewKey);
		context.memo.set(viewKey, null);
		return null;
	}

	const entry = context.normalizedViews.get(viewKey);
	if (!entry) {
		return null;
	}

	const nextStack = new Set(stack);
	nextStack.add(viewKey);
	const expanded = expandSqlBody(entry.sql, nextStack, context);

	if (containsSelfReference(expanded.sql, viewKey)) {
		context.blocked.add(viewKey);
		context.memo.set(viewKey, null);
		return null;
	}

	context.memo.set(viewKey, expanded.sql);
	context.expandedViewCache.set(viewKey, expanded.sql);
	return expanded.sql;
}

function containsSelfReference(sql: string, viewKey: string): boolean {
	const tokens = tokenize(sql);
	return findTableFactor(tokens, viewKey) !== null;
}

function collectCandidateViewKeys(
	tokens: Token[],
	normalizedViews: Map<string, NormalizedView>
): Set<string> {
	const keys = new Set<string>();
	for (const token of tokens) {
		if (!token) continue;
		if (token.tokenType === Ident || token.tokenType === QIdent) {
			const key = normalizeIdentifier(token.image);
			if (normalizedViews.has(key)) {
				keys.add(key);
			}
		}
	}
	return keys;
}
