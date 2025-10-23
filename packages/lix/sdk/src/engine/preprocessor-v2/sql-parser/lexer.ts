import { createToken, Lexer, type TokenType } from "chevrotain";

export const Whitespace: TokenType = createToken({
	name: "Whitespace",
	pattern: /[\s\t\n\r]+/,
	group: Lexer.SKIPPED,
});

export const Select: TokenType = createToken({
	name: "Select",
	pattern: /select/i,
});

export const From: TokenType = createToken({
	name: "From",
	pattern: /from/i,
});

export const As: TokenType = createToken({
	name: "As",
	pattern: /as/i,
});

export const Identifier: TokenType = createToken({
	name: "Identifier",
	pattern: /[A-Za-z_][A-Za-z0-9_]*/,
	longer_alt: [Select, From, As],
});

export const QuotedIdentifier: TokenType = createToken({
	name: "QuotedIdentifier",
	pattern: /"(?:[^"]|"")*"/,
});

export const Star: TokenType = createToken({
	name: "Star",
	pattern: /\*/,
});

export const Comma: TokenType = createToken({
	name: "Comma",
	pattern: /,/,
});

export const Dot: TokenType = createToken({
	name: "Dot",
	pattern: /\./,
});

export const Semicolon: TokenType = createToken({
	name: "Semicolon",
	pattern: /;/,
});

const tokens: TokenType[] = [
	Whitespace,
	Select,
	From,
	As,
	Star,
	Comma,
	Dot,
	Semicolon,
	QuotedIdentifier,
	Identifier,
];

export const sqlTokens: TokenType[] = tokens;

export const sqlLexer: Lexer = new Lexer(tokens, {
	positionTracking: "onlyOffset",
});
