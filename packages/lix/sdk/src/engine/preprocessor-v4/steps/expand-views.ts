import { Lexer, createToken, type IToken, type TokenType } from "chevrotain";
import type { PreprocessorStep, PreprocessorStatement } from "../types.js";

type SqlViews = Map<string, string>;

type ViewReference = {
	readonly viewName: string;
	readonly aliasText: string;
	readonly startOffset: number;
	readonly endOffset: number;
};

type ViewExpansionContext = {
	readonly views: SqlViews;
	readonly expanded: Map<string, string>;
	readonly blocked: Set<string>;
};

type Token = IToken;

type ExpandResult = {
	readonly sql: string;
	readonly changed: boolean;
	readonly expandedViews: ReadonlyArray<string>;
};

type ExpandArgs = {
	readonly sql: string;
	readonly context: ViewExpansionContext;
	readonly stack: Set<string>;
};

type ExpandOnceArgs = ExpandArgs;
type ExpandOnceResult = {
	readonly sql: string;
	readonly viewName: string;
} | null;

const WhiteSpace = createToken({
	name: "WhiteSpace",
	pattern: /\s+/,
	group: Lexer.SKIPPED,
	line_breaks: true,
});

const LineComment = createToken({
	name: "LineComment",
	pattern: /--[^\n]*/,
	group: Lexer.SKIPPED,
	line_breaks: true,
});

const BlockComment = createToken({
	name: "BlockComment",
	pattern: /\/\*[\s\S]*?\*\//,
	group: Lexer.SKIPPED,
	line_breaks: true,
});

const Comma = createToken({ name: "Comma", pattern: /,/ });
const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const Star = createToken({ name: "Star", pattern: /\*/ });

const Ident = createToken({
	name: "Ident",
	pattern: /[A-Za-z_][\w$]*/,
});

const QIdent = createToken({
	name: "QIdent",
	pattern: /"(?:[^"]|"")*"/,
	line_breaks: true,
});

const SQStr = createToken({
	name: "SQStr",
	pattern: /'(?:[^']|'')*'/,
	line_breaks: true,
});

const WITH = createToken({
	name: "WITH",
	pattern: /WITH/i,
	longer_alt: Ident,
});

const AS = createToken({
	name: "AS",
	pattern: /AS/i,
	longer_alt: Ident,
});

const RECURSIVE = createToken({
	name: "RECURSIVE",
	pattern: /RECURSIVE/i,
	longer_alt: Ident,
});

const SELECT = createToken({
	name: "SELECT",
	pattern: /SELECT/i,
	longer_alt: Ident,
});

const FROM = createToken({
	name: "FROM",
	pattern: /FROM/i,
	longer_alt: Ident,
});

const UNION = createToken({
	name: "UNION",
	pattern: /UNION/i,
	longer_alt: Ident,
});

const ALL = createToken({
	name: "ALL",
	pattern: /ALL/i,
	longer_alt: Ident,
});

const JOIN = createToken({
	name: "JOIN",
	pattern: /JOIN/i,
	longer_alt: Ident,
});

const ON = createToken({
	name: "ON",
	pattern: /ON/i,
	longer_alt: Ident,
});

const tokenTypes: TokenType[] = [
	WhiteSpace,
	LineComment,
	BlockComment,
	Comma,
	LParen,
	RParen,
	Star,
	SQStr,
	WITH,
	RECURSIVE,
	AS,
	SELECT,
	FROM,
	UNION,
	ALL,
	JOIN,
	ON,
	Ident,
	QIdent,
];

const lexer = new Lexer(tokenTypes, { ensureOptimizations: true });

const tokenizeSql = (sql: string): Token[] => lexer.tokenize(sql).tokens;

const normalizeIdentifier = (value: string): string => {
	if (value.startsWith('"')) {
		return value.slice(1, -1).replace(/""/g, '"').toLowerCase();
	}
	return value.toLowerCase();
};

const containsStateReference = (sql: string): boolean =>
	/\blix_internal_state_vtable\b/i.test(sql);

const isTableContext = (type: TokenType | undefined): boolean =>
	type === FROM || type === JOIN || type === Comma;

const locateViewReference = (
	tokens: Token[],
	index: number,
	views: SqlViews
): ViewReference | null => {
	const token = tokens[index];
	if (!token) {
		return null;
	}

	if (token.tokenType !== Ident && token.tokenType !== QIdent) {
		return null;
	}

	const viewName = normalizeIdentifier(token.image);
	if (!views.has(viewName)) {
		return null;
	}

	const previous = tokens[index - 1];
	if (previous && !isTableContext(previous.tokenType)) {
		return null;
	}

	let aliasToken: Token | undefined;
	let lookahead = index + 1;

	if (tokens[lookahead]?.tokenType === AS) {
		lookahead += 1;
	}

	const candidate = tokens[lookahead];
	if (
		candidate &&
		(candidate.tokenType === Ident || candidate.tokenType === QIdent)
	) {
		aliasToken = candidate;
	}

	const aliasText = aliasToken ? aliasToken.image : token.image;
	const endToken = aliasToken ?? token;

	return {
		viewName,
		aliasText,
		startOffset: token.startOffset ?? 0,
		endOffset:
			endToken.endOffset ?? endToken.startOffset ?? token.startOffset ?? 0,
	};
};

const expandSqlOnce = ({
	sql,
	context,
	stack,
}: ExpandOnceArgs): ExpandOnceResult => {
	const tokens = tokenizeSql(sql);

	for (let index = 0; index < tokens.length; index += 1) {
		const reference = locateViewReference(tokens, index, context.views);
		if (!reference) {
			continue;
		}

		const expanded = expandViewDefinition({
			viewName: reference.viewName,
			context,
			stack,
		});

		if (!expanded) {
			continue;
		}

		const replacement = `( ${expanded} ) AS ${reference.aliasText}`;
		return {
			sql:
				sql.slice(0, reference.startOffset) +
				replacement +
				sql.slice(reference.endOffset + 1),
			viewName: reference.viewName,
		};
	}

	return null;
};

const expandSql = ({ sql, context, stack }: ExpandArgs): ExpandResult => {
	let current = sql;
	let changed = false;
	const expandedViews: string[] = [];

	while (true) {
		const next = expandSqlOnce({ sql: current, context, stack });
		if (!next) {
			break;
		}
		current = next.sql;
		changed = true;
		expandedViews.push(next.viewName);
	}

	return { sql: current, changed, expandedViews };
};

type ExpandDefinitionArgs = {
	readonly viewName: string;
	readonly context: ViewExpansionContext;
	readonly stack: Set<string>;
};

const expandViewDefinition = ({
	viewName,
	context,
	stack,
}: ExpandDefinitionArgs): string | null => {
	if (context.blocked.has(viewName)) {
		return null;
	}

	const cached = context.expanded.get(viewName);
	if (cached) {
		return cached;
	}

	if (stack.has(viewName)) {
		context.blocked.add(viewName);
		return null;
	}

	const definition = context.views.get(viewName);
	if (!definition) {
		return null;
	}

	const nextStack = new Set(stack);
	nextStack.add(viewName);

	const { sql: expandedSql } = expandSql({
		sql: definition,
		context,
		stack: nextStack,
	});

	if (!containsStateReference(expandedSql)) {
		context.blocked.add(viewName);
		return null;
	}

	context.expanded.set(viewName, expandedSql);
	return expandedSql;
};

const expandStatement = (
	statement: PreprocessorStatement,
	context: ViewExpansionContext
): {
	readonly statement: PreprocessorStatement;
	readonly expandedViews: ReadonlyArray<string>;
	readonly changed: boolean;
} => {
	const { sql: expandedSql, changed, expandedViews } = expandSql({
		sql: statement.sql,
		context,
		stack: new Set(),
	});

	if (!changed) {
		return { statement, expandedViews, changed: false };
	}

	return {
		statement: {
			...statement,
			sql: expandedSql,
		},
		expandedViews,
		changed: true,
	};
};

const expandStatements = (
	statements: ReadonlyArray<PreprocessorStatement>,
	views: SqlViews
): {
	readonly statements: ReadonlyArray<PreprocessorStatement>;
	readonly expandedViews: ReadonlyArray<string>;
} => {
	const context: ViewExpansionContext = {
		views,
		expanded: new Map(),
		blocked: new Set(),
	};

	const expandedStatements: PreprocessorStatement[] = [];
	const expandedViewSet = new Set<string>();
	let changed = false;

	for (const statement of statements) {
		const result = expandStatement(statement, context);
		expandedStatements.push(result.statement);
		if (result.changed) {
			changed = true;
		}
		for (const viewName of result.expandedViews) {
			expandedViewSet.add(viewName);
		}
	}

	return {
		statements: changed ? expandedStatements : statements,
		expandedViews: Array.from(expandedViewSet),
	};
};

/**
 * Expands SQL view references into their stored definitions using the v4 Chevrotain parser.
 */
export const expandViews: PreprocessorStep = ({
	statements,
	getSqlViews,
	trace,
}) => {
	const recordTrace = (payload: {
		readonly expanded: boolean;
		readonly views: ReadonlyArray<string>;
	}) => {
		if (!trace) {
			return;
		}
		trace.push({
			step: "expand_views",
			payload,
		});
	};

	if (!getSqlViews) {
		recordTrace({ expanded: false, views: [] });
		return { statements };
	}

	const sourceViews = getSqlViews();
	if (!sourceViews || sourceViews.size === 0) {
		recordTrace({ expanded: false, views: [] });
		return { statements };
	}

	const normalizedViews: SqlViews = new Map(
		Array.from(sourceViews.entries(), ([name, sql]) => [
			normalizeIdentifier(name),
			sql,
		])
	);

	const { statements: nextStatements, expandedViews } = expandStatements(
		statements,
		normalizedViews
	);

	recordTrace({
		expanded: expandedViews.length > 0,
		views: expandedViews,
	});

	if (expandedViews.length === 0) {
		return { statements };
	}

	return { statements: nextStatements };
};
