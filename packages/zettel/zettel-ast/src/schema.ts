import { Type, type Static } from "@sinclair/typebox";

/**
 * A [Portable Text](https://github.com/portabletext/portabletext) node.
 *
 * A node always has to have a `_type` and a `_key`.
 */
export type BaseNode = Static<typeof BaseNode>;
const BaseNode = Type.Object({
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
export type ZettelAccountMentionMarkDef = Static<typeof ZettelAccountMentionMarkDef>;
const ZettelAccountMentionMarkDef = Type.Object({
	_key: Type.String({}),
	_type: Type.Literal("zettel.accountMention"),
	id: Type.String({
		description: "The ID of the account being mentioned",
	}),
	metadata: Metadata,
});

export type ZettelLinkMarkDef = Static<typeof ZettelLinkMarkDef>;
const ZettelLinkMarkDef = Type.Object({
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
export type MarkDef = ZettelAccountMentionMarkDef | ZettelLinkMarkDef | BaseNode;
const MarkDef = Type.Union([ZettelAccountMentionMarkDef, ZettelLinkMarkDef, BaseNode]);

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
 *     "marks": ["zettel.strong", "93j9jas09j2"],
 *     "text": "Hello world"
 *   }
 *   ```
 */
export type ZettelSpan = Static<typeof ZettelSpan>;
const ZettelSpan = Type.Object({
	_type: Type.Literal("zettel.span"),
	_key: Type.String(),
	marks: Type.Array(
		Type.String({
			description:
				"A mark identifier: either 'zettel.strong', 'zettel.em', 'zettel.code', a key for a MarkDef, or a custom mark string (which cannot start with 'zettel.').",
			pattern: "^(zettel\\.strong|zettel\\.em|zettel\\.code)$|^(?!zettel\\.).*$", // Escaped backslashes for JS string
		})
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
		Type.Literal("zettel.normal"),
		Type.Literal("zettel.h1"),
		Type.Literal("zettel.h2"),
		Type.Literal("zettel.h3"),
		Type.String({
			description:
				"The key of a custom block. Renderers that don't support this block will render it as a zettel.normal block.",
		}),
	]),
	children: Type.Array(ZettelSpan, {
		description: "Array of inline spans that make up the block content",
	}),
	markDefs: Type.Array(MarkDef, {
		description: "Array of annotations (links, mentions) used by spans in this block",
	}),
	metadata: Metadata,
});

// Represents any block that is *not* a ZettelTextBlock but has the basic node requirements
const CustomBlock = Type.Intersect([
	BaseNode, // Must have _type and _key
	Type.Object({
		_type: Type.Not(Type.Literal("zettel.textBlock")), // _type cannot be zettel.textBlock
	}),
]);

export type ZettelDoc = Static<typeof ZettelDoc>;
// A document is an array of either ZettelTextBlocks or CustomBlocks
const ZettelDoc = Type.Array(Type.Union([ZettelTextBlock, CustomBlock]));

export const ZettelDocJsonSchema = ZettelDoc;
