import { createToken, Lexer, type IToken, type TokenType } from "chevrotain";

/**
 * Resilient Chevrotain-based tokenizer for the SQL fragments the rewriter cares about.
 *
 * The lexer skips whitespace and comments and recognizes identifiers (quoted/unquoted),
 * SQLite-style named parameters, basic punctuation, and the subset of keywords that
 * drive internal_state_vtable rewriting.
 *
 * @example
 * ```ts
 * import { tokenize, FROM, Ident } from "./tokenizer";
 * const sql = "SELECT * FROM internal_state_vtable";
 * const tokens = tokenize(sql);
 * const fromIx = tokens.findIndex((t) => t.tokenType === FROM);
 * console.log(tokens[fromIx + 1].tokenType === Ident); // true
 * ```
 */

const WhiteSpace: TokenType = createToken({
	name: "WhiteSpace",
	pattern: /\s+/,
	group: Lexer.SKIPPED,
	line_breaks: true,
});

const LineComment: TokenType = createToken({
	name: "LineComment",
	pattern: /--[^\n]*/,
	group: Lexer.SKIPPED,
	line_breaks: true,
});

const BlockComment: TokenType = createToken({
	name: "BlockComment",
	pattern: /\/\*[\s\S]*?\*\//,
	group: Lexer.SKIPPED,
	line_breaks: true,
});

export const Comma: TokenType = createToken({ name: "Comma", pattern: /,/ });
export const Dot: TokenType = createToken({ name: "Dot", pattern: /\./ });
export const LParen: TokenType = createToken({ name: "LParen", pattern: /\(/ });
export const RParen: TokenType = createToken({ name: "RParen", pattern: /\)/ });
export const Star: TokenType = createToken({ name: "Star", pattern: /\*/ });

export const SQStr: TokenType = createToken({
	name: "SQStr",
	pattern: /'(?:[^']|'')*'/,
	line_breaks: true,
});

export const Num: TokenType = createToken({
	name: "Num",
	pattern: /\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/,
});

export const QMarkNumber: TokenType = createToken({
	name: "QMarkNumber",
	pattern: /\?\d+/,
});
export const QMark: TokenType = createToken({ name: "QMark", pattern: /\?/ });
export const DollarName: TokenType = createToken({
	name: "DollarName",
	pattern: /\$[A-Za-z_][\w$]*/,
});
export const DollarNumber: TokenType = createToken({
	name: "DollarNumber",
	pattern: /\$\d+/,
});
export const AtName: TokenType = createToken({
	name: "AtName",
	pattern: /@[A-Za-z_][\w$]*/,
});
export const ColonName: TokenType = createToken({
	name: "ColonName",
	pattern: /:[A-Za-z_][\w$]*/,
});

export const Equals: TokenType = createToken({ name: "Equals", pattern: /=/ });
export const Minus: TokenType = createToken({ name: "Minus", pattern: /-/ });
export const Plus: TokenType = createToken({ name: "Plus", pattern: /\+/ });
export const Pipe: TokenType = createToken({ name: "Pipe", pattern: /\|\|/ });
export const Semicolon: TokenType = createToken({
	name: "Semicolon",
	pattern: /;/,
});

export const QIdent: TokenType = createToken({
	name: "QIdent",
	pattern: /"(?:[^"]|"")*"/,
	line_breaks: true,
});

export const Ident: TokenType = createToken({
	name: "Ident",
	pattern: /[A-Za-z_][\w$]*/,
});

function keyword(name: string): TokenType {
	return createToken({
		name,
		pattern: new RegExp(name, "i"),
		longer_alt: Ident,
	});
}

export const SELECT: TokenType = keyword("SELECT");
export const FROM: TokenType = keyword("FROM");
export const JOIN: TokenType = keyword("JOIN");
export const AS: TokenType = keyword("AS");
export const WHERE: TokenType = keyword("WHERE");
export const LIMIT: TokenType = keyword("LIMIT");
export const ORDER: TokenType = keyword("ORDER");
export const BY: TokenType = keyword("BY");
export const GROUP: TokenType = keyword("GROUP");
export const HAVING: TokenType = keyword("HAVING");
export const WINDOW: TokenType = keyword("WINDOW");
export const OFFSET: TokenType = keyword("OFFSET");
export const FETCH: TokenType = keyword("FETCH");
export const ON: TokenType = keyword("ON");
export const AND: TokenType = keyword("AND");
export const OR: TokenType = keyword("OR");
export const IS: TokenType = keyword("IS");
export const NOT: TokenType = keyword("NOT");
export const NULL: TokenType = keyword("NULL");
export const CAST: TokenType = keyword("CAST");
export const WITH: TokenType = keyword("WITH");
export const INSERT: TokenType = keyword("INSERT");
export const UPDATE: TokenType = keyword("UPDATE");
export const DELETE: TokenType = keyword("DELETE");

const allTokens: TokenType[] = [
	WhiteSpace,
	LineComment,
	BlockComment,
	Comma,
	Dot,
	LParen,
	RParen,
	Star,
	Equals,
	Minus,
	Plus,
	Pipe,
	Semicolon,
	SQStr,
	Num,
	QMarkNumber,
	QMark,
	DollarName,
	DollarNumber,
	AtName,
	ColonName,
	QIdent,
	SELECT,
	FROM,
	JOIN,
	AS,
	WHERE,
	LIMIT,
	ORDER,
	BY,
	GROUP,
	HAVING,
	WINDOW,
	OFFSET,
	FETCH,
	ON,
	AND,
	OR,
	IS,
	NOT,
	NULL,
	CAST,
	WITH,
	INSERT,
	UPDATE,
	DELETE,
	Ident,
];

const lexer = new Lexer(allTokens, { ensureOptimizations: true });

export type Token = IToken;

/**
 * Tokenize an input SQL string into a flat sequence of Chevrotain tokens.
 *
 * Errors are tolerated; if the lexer encounters unrecognized characters the caller
 * can decide how to handle the partial output.
 *
 * @example
 * ```ts
 * const [first] = tokenize("SELECT 1");
 * console.log(first.image); // SELECT
 * ```
 */
export function tokenize(input: string): Token[] {
	const { tokens, errors } = lexer.tokenize(input);
	if (errors.length > 0) {
		// Preserve partial tokenization; downstream code can fall back gracefully.
	}
	return tokens;
}
