import { Type, type Static } from "@sinclair/typebox";

/**
 * A [Portable Text](https://github.com/portabletext/portabletext) node.
 *
 * A node always has to have a `_type` and a `_key`.
 */
export type PortableTextNode = Static<typeof PortableTextNode>;
const PortableTextNode = Type.Object({
	_type: Type.String(),
	_key: Type.String({
		description: "Unique key for this node within the document",
	}),
});

const Metadata = Type.Optional(Type.Record(Type.String(), Type.Unknown()));

/**
 * An account mention annotation.
 *
 * @example
 *   ```json
 *   [
 *     {
 *       "_type": "zettel.textBlock",
 *       "_key": "uniqueKey",
 *       "style": "normal",
 *       "children": [
 *         {
 *           "_type": "zettel.span",
 *           "_key": "uniqueKeySpanKey",
 *           "text": "Username",
 *           "marks": ["uniqueKeyMarkDefKey"]
 *         }
 *       ],
 *       "markDefs": [
 *         {
 *           "_type": "zettel.accountMention",
 *           "_key": "uniqueKeyMarkDefKey",
 *           "id": "47237hh8h4h75"
 *         }
 *       ]
 *     }
 *   ]
 *   ```
 */
export type ZettelAccountMentionAnnotation = Static<typeof ZettelAccountMentionAnnotation>;
const ZettelAccountMentionAnnotation = Type.Object({
	_key: Type.String({}),
	_type: Type.Literal("zettel.accountMention"),
	id: Type.String({
		description: "The ID of the account being mentioned",
	}),
	metadata: Metadata,
});

export type ZettelLinkAnnotation = Static<typeof ZettelLinkAnnotation>;
const ZettelLinkAnnotation = Type.Object({
	_key: Type.String({}),
	_type: Type.Literal("zettel.link"),
	href: Type.String({
		description: "The target URL of the link",
	}),
	metadata: Metadata,
});

/**
 * A mark definition defines an annotation (e.g. mentions, links) that can be applied to a span.
 *
 * @example
 *   ```json
 *   [
 *     {
 *       "_type": "zettel.textBlock",
 *       "_key": "uniqueKey",
 *       "style": "normal",
 *       "children": [
 *         {
 *           "_type": "zettel.span",
 *           "_key": "uniqueKeySpanKey",
 *           "text": "Username",
 *           "marks": ["uniqueKeyMarkDefKey"]
 *         }
 *       ],
 *       "markDefs": [
 *         {
 *           "_type": "zettel.accountMention",
 *           "_key": "uniqueKeyMarkDefKey",
 *           "id": "47237hh8h4h75"
 *         }
 *       ]
 *     },
 *   ]
 *   ```
 */
export type MarkDef = ZettelAccountMentionAnnotation | ZettelLinkAnnotation | PortableTextNode;
const MarkDef = Type.Union([
	ZettelAccountMentionAnnotation,
	ZettelLinkAnnotation,
	PortableTextNode,
]);

/**
 * A span is an inline element in a Zettel document.
 *
 * Marks are decorators (e.g. bold, italic, underline) or annotations (e.g. mentions, links) applied to a span.
 *
 * **What is the difference between decorators and annotations?**
 *
 * Decorators are a simple string that needs no additional properties. Annotations are objects that need additional properties.
 * For example, a link annotation needs a URL and an account mention annotation needs an account ID, but decorators
 * like "strong" or "em" don't need any additional properties.
 *
 * @example
 *   ```json
 *   {
 *     "_type": "zettel.span",
 *     "_key": "uniqueKey",
 *     "marks": ["strong", "93j9jas09j2"],
 *     "text": "Hello world"
 *   }
 *   ```
 */
export type ZettelSpan = Static<typeof ZettelSpan>;
const ZettelSpan = Type.Object({
	_type: Type.Literal("zettel.span"),
	_key: Type.String(),
	marks: Type.Array(
		Type.Union([
			Type.Literal("strong"),
			Type.Literal("italic"),
			Type.String({ description: "The key of a markDef" }),
		])
	),
	text: Type.String({ description: "The text content of this span" }),
	metadata: Metadata,
});

/**
 * A text block.
 *
 * @example
 *   ```json
 *   [
 *     {
 *       "_type": "zettel.textBlock",
 *       "_key": "uniqueKey",
 *       "style": "h1",
 *       "children": [
 *         {
 *           "_type": "zettel.span",
 *           "_key": "uniqueKey",
 *           "text": "Hello world"
 *         }
 *       ],
 *       "markDefs": []
 *     }
 *   ]
 *   ```
 */
export type ZettelTextBlock = Static<typeof ZettelTextBlock>;
const ZettelTextBlock = Type.Object({
	_type: Type.Literal("zettel.textBlock"),
	_key: Type.String(),
	style: Type.Union([
		Type.Literal("normal"),
		Type.Literal("h1"),
		Type.Literal("h2"),
		Type.Literal("h3"),
	]),
	children: Type.Array(ZettelSpan, {
		description: "Array of inline spans that make up the block content",
	}),
	markDefs: Type.Array(MarkDef, {
		description: "Array of annotations (links, mentions) used by spans in this block",
	}),
	metadata: Metadata,
});

export type Zettel = Static<typeof Zettel>;
const Zettel = Type.Array(Type.Union([ZettelTextBlock, PortableTextNode]));

export const ZettelJsonSchema = Zettel;
