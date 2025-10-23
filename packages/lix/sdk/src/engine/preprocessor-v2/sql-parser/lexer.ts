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

export const Where: TokenType = createToken({
	name: "Where",
	pattern: /where/i,
});

export const And: TokenType = createToken({
	name: "And",
	pattern: /and/i,
});

export const Or: TokenType = createToken({
	name: "Or",
	pattern: /or/i,
});

export const Order: TokenType = createToken({
	name: "Order",
	pattern: /order/i,
});

export const By: TokenType = createToken({
	name: "By",
	pattern: /by/i,
});

export const Asc: TokenType = createToken({
	name: "Asc",
	pattern: /asc/i,
});

export const Desc: TokenType = createToken({
	name: "Desc",
	pattern: /desc/i,
});

export const Inner: TokenType = createToken({
	name: "Inner",
	pattern: /inner/i,
});

export const Left: TokenType = createToken({
	name: "Left",
	pattern: /left/i,
});

export const Right: TokenType = createToken({
	name: "Right",
	pattern: /right/i,
});

export const Full: TokenType = createToken({
	name: "Full",
	pattern: /full/i,
});

export const Join: TokenType = createToken({
	name: "Join",
	pattern: /join/i,
});

export const On: TokenType = createToken({
	name: "On",
	pattern: /on/i,
});

export const As: TokenType = createToken({
	name: "As",
	pattern: /as/i,
});

export const Identifier: TokenType = createToken({
	name: "Identifier",
	pattern: /[A-Za-z_][A-Za-z0-9_]*/,
	longer_alt: [
		Select,
		From,
		Where,
		And,
		Order,
		Or,
		By,
		Asc,
		Desc,
		Inner,
		Left,
		Right,
		Full,
		Join,
		On,
		As,
	],
});

export const QuotedIdentifier: TokenType = createToken({
	name: "QuotedIdentifier",
	pattern: /"(?:[^"]|"")*"/,
});

export const StringLiteral: TokenType = createToken({
	name: "StringLiteral",
	pattern: /'(?:''|[^'])*'/,
});

export const NumberLiteral: TokenType = createToken({
	name: "NumberLiteral",
	pattern: /[0-9]+(?:\.[0-9]+)?/,
});

export const Star: TokenType = createToken({
	name: "Star",
	pattern: /\*/,
});

export const Comma: TokenType = createToken({
	name: "Comma",
	pattern: /,/,
});

export const LeftParen: TokenType = createToken({
	name: "LeftParen",
	pattern: /\(/,
});

export const RightParen: TokenType = createToken({
	name: "RightParen",
	pattern: /\)/,
});

export const Dot: TokenType = createToken({
	name: "Dot",
	pattern: /\./,
});

export const Parameter: TokenType = createToken({
	name: "Parameter",
	pattern: /\?/,
});

export const Semicolon: TokenType = createToken({
	name: "Semicolon",
	pattern: /;/,
});

export const Equals: TokenType = createToken({
	name: "Equals",
	pattern: /=/,
});

const tokens: TokenType[] = [
	Whitespace,
	Select,
	From,
	Where,
	And,
	Order,
	Or,
	By,
	Asc,
	Desc,
	Inner,
	Left,
	Right,
	Full,
	Join,
	On,
	As,
	Star,
	Comma,
	LeftParen,
	RightParen,
	Dot,
	Parameter,
	Semicolon,
	Equals,
	StringLiteral,
	NumberLiteral,
	QuotedIdentifier,
	Identifier,
];

export const sqlTokens: TokenType[] = tokens;

export const sqlLexer: Lexer = new Lexer(tokens, {
	positionTracking: "onlyOffset",
});
