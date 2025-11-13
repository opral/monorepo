import { createToken, Lexer, type TokenType } from "chevrotain";

export const Whitespace: TokenType = createToken({
	name: "Whitespace",
	pattern: /[\s\t\n\r]+/,
	group: Lexer.SKIPPED,
});

export const LineComment: TokenType = createToken({
	name: "LineComment",
	pattern: /--[^\n\r]*/,
	group: Lexer.SKIPPED,
});

export const Select: TokenType = createToken({
	name: "Select",
	pattern: /select\b/i,
});

export const Insert: TokenType = createToken({
	name: "Insert",
	pattern: /insert\b/i,
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

export const Into: TokenType = createToken({
	name: "Into",
	pattern: /into\b/i,
});

export const DefaultKeyword: TokenType = createToken({
	name: "DefaultKeyword",
	pattern: /default\b/i,
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

export const Limit: TokenType = createToken({
	name: "Limit",
	pattern: /limit\b/i,
});

export const Offset: TokenType = createToken({
	name: "Offset",
	pattern: /offset\b/i,
});

export const Order: TokenType = createToken({
	name: "Order",
	pattern: /order\b/i,
});

export const By: TokenType = createToken({
	name: "By",
	pattern: /by\b/i,
});

export const Distinct: TokenType = createToken({
	name: "Distinct",
	pattern: /distinct\b/i,
});

export const Asc: TokenType = createToken({
	name: "Asc",
	pattern: /asc\b/i,
});

export const Desc: TokenType = createToken({
	name: "Desc",
	pattern: /desc\b/i,
});

export const Group: TokenType = createToken({
	name: "Group",
	pattern: /group\b/i,
});

export const Union: TokenType = createToken({
	name: "Union",
	pattern: /union\b/i,
});

export const All: TokenType = createToken({
	name: "All",
	pattern: /all\b/i,
});

export const Intersect: TokenType = createToken({
	name: "Intersect",
	pattern: /intersect\b/i,
});

export const Except: TokenType = createToken({
	name: "Except",
	pattern: /except\b/i,
});

export const With: TokenType = createToken({
	name: "With",
	pattern: /with\b/i,
});

export const Recursive: TokenType = createToken({
	name: "Recursive",
	pattern: /recursive\b/i,
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

export const Conflict: TokenType = createToken({
	name: "Conflict",
	pattern: /conflict\b/i,
});

export const Over: TokenType = createToken({
	name: "Over",
	pattern: /over\b/i,
});

export const Partition: TokenType = createToken({
	name: "Partition",
	pattern: /partition\b/i,
});

export const RowsKeyword: TokenType = createToken({
	name: "RowsKeyword",
	pattern: /rows\b/i,
});

export const RangeKeyword: TokenType = createToken({
	name: "RangeKeyword",
	pattern: /range\b/i,
});

export const GroupsKeyword: TokenType = createToken({
	name: "GroupsKeyword",
	pattern: /groups\b/i,
});

export const UnboundedKeyword: TokenType = createToken({
	name: "UnboundedKeyword",
	pattern: /unbounded\b/i,
});

export const PrecedingKeyword: TokenType = createToken({
	name: "PrecedingKeyword",
	pattern: /preceding\b/i,
});

export const FollowingKeyword: TokenType = createToken({
	name: "FollowingKeyword",
	pattern: /following\b/i,
});

export const CurrentKeyword: TokenType = createToken({
	name: "CurrentKeyword",
	pattern: /current\b/i,
});

export const RowKeyword: TokenType = createToken({
	name: "RowKeyword",
	pattern: /row\b/i,
});

export const WindowKeyword: TokenType = createToken({
	name: "WindowKeyword",
	pattern: /window\b/i,
});

export const DoKeyword: TokenType = createToken({
	name: "DoKeyword",
	pattern: /do\b/i,
});

export const NothingKeyword: TokenType = createToken({
	name: "NothingKeyword",
	pattern: /nothing\b/i,
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

export const Exists: TokenType = createToken({
	name: "Exists",
	pattern: /exists\b/i,
});

export const Between: TokenType = createToken({
	name: "Between",
	pattern: /between\b/i,
});

export const Like: TokenType = createToken({
	name: "Like",
	pattern: /like\b/i,
});

export const CaseKeyword: TokenType = createToken({
	name: "CaseKeyword",
	pattern: /case\b/i,
});

export const WhenKeyword: TokenType = createToken({
	name: "WhenKeyword",
	pattern: /when\b/i,
});

export const ThenKeyword: TokenType = createToken({
	name: "ThenKeyword",
	pattern: /then\b/i,
});

export const ElseKeyword: TokenType = createToken({
	name: "ElseKeyword",
	pattern: /else\b/i,
});

export const EndKeyword: TokenType = createToken({
	name: "EndKeyword",
	pattern: /end\b/i,
});

export const As: TokenType = createToken({
	name: "As",
	pattern: /as\b/i,
});

export const Values: TokenType = createToken({
	name: "Values",
	pattern: /values\b/i,
});

export const Identifier: TokenType = createToken({
	name: "Identifier",
	pattern: /[A-Za-z_][A-Za-z0-9_]*/,
	longer_alt: [
		Select,
		Insert,
		Update,
		Delete,
		From,
		Into,
		DefaultKeyword,
		Where,
		And,
		Order,
		Limit,
		Offset,
		Or,
		Not,
		By,
		Distinct,
		Asc,
		Desc,
		Group,
		Inner,
		Left,
		Right,
		Full,
		Join,
		On,
		Conflict,
		Over,
		Partition,
		RowsKeyword,
		RangeKeyword,
		GroupsKeyword,
		UnboundedKeyword,
		PrecedingKeyword,
		FollowingKeyword,
		CurrentKeyword,
		RowKeyword,
		WindowKeyword,
		DoKeyword,
		NothingKeyword,
		With,
		Recursive,
		Is,
		InKeyword,
		NullKeyword,
		Exists,
		Between,
		Like,
		CaseKeyword,
		WhenKeyword,
		ThenKeyword,
		ElseKeyword,
		EndKeyword,
		SetKeyword,
		DefaultKeyword,
		Values,
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
	pattern: /\?[0-9]*/,
});

export const Semicolon: TokenType = createToken({
	name: "Semicolon",
	pattern: /;/,
});

export const Equals: TokenType = createToken({
	name: "Equals",
	pattern: /=/,
});

export const JsonExtractText: TokenType = createToken({
	name: "JsonExtractText",
	pattern: /->>/,
});

export const JsonExtract: TokenType = createToken({
	name: "JsonExtract",
	pattern: /->/,
	longer_alt: [JsonExtractText],
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

export const Concat: TokenType = createToken({
	name: "Concat",
	pattern: /\|\|/,
});

const tokens: TokenType[] = [
	LineComment,
	Whitespace,
	Select,
	Insert,
	Update,
	Delete,
	From,
	Into,
	DefaultKeyword,
	Where,
	And,
	Order,
	Limit,
	Offset,
	Or,
	Not,
	By,
	Distinct,
	Asc,
	Desc,
	Group,
	Inner,
	Left,
	Right,
	Full,
	Join,
	On,
	Conflict,
	Over,
	Partition,
	RowsKeyword,
	RangeKeyword,
	GroupsKeyword,
	UnboundedKeyword,
	PrecedingKeyword,
	FollowingKeyword,
	CurrentKeyword,
	RowKeyword,
	WindowKeyword,
	DoKeyword,
	NothingKeyword,
	Union,
	All,
	Intersect,
	Except,
	With,
	Recursive,
	Is,
	InKeyword,
	NullKeyword,
	Exists,
	Between,
	Like,
	CaseKeyword,
	WhenKeyword,
	ThenKeyword,
	ElseKeyword,
	EndKeyword,
	SetKeyword,
	Values,
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
	Concat,
	JsonExtractText,
	JsonExtract,
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
