import { Type, type Static } from "@sinclair/typebox";

export type AccountMentionMarkDef = Static<typeof AccountMentionMarkDef>;
const AccountMentionMarkDef = Type.Object({
	_key: Type.String({
		description: "Unique key for this mention within the block",
	}),
	_type: Type.Literal("accountMention"),
	id: Type.String({
		description: "The ID of the account being mentioned",
	}),
});

export type LinkMarkDef = Static<typeof LinkMarkDef>;
const LinkMarkDef = Type.Object({
	_key: Type.String({
		description: "Unique key for this link within the block",
	}),
	_type: Type.Literal("link"),
	href: Type.String({
		description: "The target URL of the link",
	}),
});

export type MarkDef = Static<typeof MarkDef>;
const MarkDef = Type.Union([AccountMentionMarkDef, LinkMarkDef]);

export type Span = Static<typeof Span>;
const Span = Type.Object({
	_type: Type.Literal("span"),
	_key: Type.String({
		description: "Unique key for this span within the block",
	}),
	marks: Type.Array(Type.String(), {
		description:
			"Array of decorators or annotation keys (_key) referencing items in the parent block's markDefs",
	}),
	text: Type.String({ description: "The text content of this span" }),
});

export type Block = Static<typeof Block>;
const Block = Type.Object({
	_type: Type.Literal("block"),
	_key: Type.String({
		description: "Unique key for this block within the document",
	}),
	style: Type.String({
		default: "normal",
		description: "The style of the block, e.g., normal, h1, etc.",
	}),
	children: Type.Array(Span, {
		description: "Array of inline spans that make up the block content",
	}),
	markDefs: Type.Array(MarkDef, {
		description: "Array of annotations (links, mentions) used by spans in this block",
	}),
});

export type ZettelAst = Static<typeof ZettelAst>;
const ZettelAst = Type.Array(Block);

export const ZettelAstJsonSchema = Type.Array(Block);
