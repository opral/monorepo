import { createToken, Lexer, type TokenType } from "chevrotain";

export const Whitespace: TokenType = createToken({
	name: "Whitespace",
	pattern: /[\s\t\n\r]+/,
	group: Lexer.SKIPPED,
});

export const Select: TokenType = createToken({
	name: "Select",
	pattern: /select\b/i,
});

export const Update: TokenType = createToken({
	name: "Update",
	pattern: /update\b/i,
});

export const Delete: TokenType = createToken({
	name: "Delete",
	pattern: /delete\b/i,
});

export const From: TokenType = createToken({
	name: "From",
	pattern: /from\b/i,
});

export const Where: TokenType = createToken({
	name: "Where",
	pattern: /where\b/i,
});

export const And: TokenType = createToken({
	name: "And",
	pattern: /and\b/i,
});

export const Or: TokenType = createToken({
	name: "Or",
	pattern: /or\b/i,
});

export const Not: TokenType = createToken({
	name: "Not",
	pattern: /not\b/i,
});

export const Order: TokenType = createToken({
	name: "Order",
	pattern: /order\b/i,
});

export const By: TokenType = createToken({
	name: "By",
	pattern: /by\b/i,
});

export const Asc: TokenType = createToken({
	name: "Asc",
	pattern: /asc\b/i,
});

export const Desc: TokenType = createToken({
	name: "Desc",
	pattern: /desc\b/i,
});

export const Inner: TokenType = createToken({
	name: "Inner",
	pattern: /inner\b/i,
});

export const Left: TokenType = createToken({
	name: "Left",
	pattern: /left\b/i,
});

export const Right: TokenType = createToken({
	name: "Right",
	pattern: /right\b/i,
});

export const Full: TokenType = createToken({
	name: "Full",
	pattern: /full\b/i,
});

export const Join: TokenType = createToken({
	name: "Join",
	pattern: /join\b/i,
});

export const On: TokenType = createToken({
	name: "On",
	pattern: /on\b/i,
});

export const SetKeyword: TokenType = createToken({
	name: "SetKeyword",
	pattern: /set\b/i,
});

export const Is: TokenType = createToken({
	name: "Is",
	pattern: /is\b/i,
});

export const InKeyword: TokenType = createToken({
	name: "InKeyword",
	pattern: /in\b/i,
});

export const NullKeyword: TokenType = createToken({
	name: "NullKeyword",
	pattern: /null\b/i,
});

export const Between: TokenType = createToken({
	name: "Between",
	pattern: /between\b/i,
});

export const Like: TokenType = createToken({
	name: "Like",
	pattern: /like\b/i,
});

export const As: TokenType = createToken({
	name: "As",
	pattern: /as\b/i,
});

export const Identifier: TokenType = createToken({
	name: "Identifier",
	pattern: /[A-Za-z_][A-Za-z0-9_]*/,
	longer_alt: [
		Select,
		Update,
		Delete,
		From,
		Where,
		And,
		Order,
		Or,
		Not,
		By,
		Asc,
		Desc,
		Inner,
		Left,
		Right,
		Full,
		Join,
		On,
		Is,
		InKeyword,
		NullKeyword,
		Between,
		Like,
		SetKeyword,
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

export const NotEquals: TokenType = createToken({
	name: "NotEquals",
	pattern: /!=/,
});

export const NotEqualsAlt: TokenType = createToken({
	name: "NotEqualsAlt",
	pattern: /<>/,
});

export const GreaterThanOrEqual: TokenType = createToken({
	name: "GreaterThanOrEqual",
	pattern: />=/,
});

export const LessThanOrEqual: TokenType = createToken({
	name: "LessThanOrEqual",
	pattern: /<=/,
});

export const GreaterThan: TokenType = createToken({
	name: "GreaterThan",
	pattern: />/,
});

export const LessThan: TokenType = createToken({
	name: "LessThan",
	pattern: /</,
});

export const Plus: TokenType = createToken({
	name: "Plus",
	pattern: /\+/,
});

export const Minus: TokenType = createToken({
	name: "Minus",
	pattern: /-/,
});

export const Slash: TokenType = createToken({
	name: "Slash",
	pattern: /\//,
});

export const Percent: TokenType = createToken({
	name: "Percent",
	pattern: /%/,
});

const tokens: TokenType[] = [
	Whitespace,
	Select,
	Update,
	Delete,
	From,
	Where,
	And,
	Order,
	Or,
	Not,
	By,
	Asc,
	Desc,
	Inner,
	Left,
	Right,
	Full,
	Join,
	On,
	Is,
	InKeyword,
	NullKeyword,
	Between,
	Like,
	SetKeyword,
	As,
	Star,
	Comma,
	LeftParen,
	RightParen,
	Dot,
	Parameter,
	Semicolon,
	NotEquals,
	NotEqualsAlt,
	GreaterThanOrEqual,
	LessThanOrEqual,
	GreaterThan,
	LessThan,
	Equals,
	Plus,
	Minus,
	Slash,
	Percent,
	StringLiteral,
	NumberLiteral,
	QuotedIdentifier,
	Identifier,
];

export const sqlTokens: TokenType[] = tokens;

export const sqlLexer: Lexer = new Lexer(tokens, {
	positionTracking: "onlyOffset",
});
