import { Type, type Static } from "@sinclair/typebox";

const Key = Type.String({
	description: "Unique key for this node within the document",
	minLength: 6,
});

/**
 * A Base Node (modeled after [Portable Text](https://github.com/portabletext/portabletext)).
 *
 * A node always has to have a `type` and a `zettel_key`.
 */
// Base node: must have type and zettel_key, and forbid any other 'zettel_' keys
const ZettelNode = Type.Intersect([
	Type.Object(
		{
			type: Type.String(),
			zettel_key: Key,
		},
		{
			propertyNames: Type.String({
				pattern: "^(?!zettel_).*|^zettel_key$",
				description: "Property names must not start with 'zettel_' except 'zettel_key'",
			}),
			additionalProperties: true,
		}
	),
	Type.Record(Type.String({ pattern: "^(?!zettel_).*|^zettel_key$" }), Type.Unknown()),
]);

export type ZettelNode = Static<typeof ZettelNode> & { [property: string]: any };

const Metadata = Type.Optional(Type.Record(Type.String(), Type.Unknown()));

export type ZettelLinkMark = Static<typeof ZettelLinkMark>;
const ZettelLinkMark = Type.Object({
	type: Type.Literal("zettel_link"),
	zettel_key: Key,
	href: Type.String({
		description: "The target URL of the link",
	}),
	metadata: Metadata,
});

export type ZettelBoldMark = Static<typeof ZettelBoldMark>;
const ZettelBoldMark = Type.Object({
	type: Type.Literal("zettel_bold"),
	zettel_key: Key,
});

export type ZettelItalicMark = Static<typeof ZettelItalicMark>;
const ZettelItalicMark = Type.Object({
	type: Type.Literal("zettel_italic"),
	zettel_key: Key,
});

// Custom marks: allow any custom type not starting with 'zettel_'
const CustomMark = Type.Object(
	{
		type: Type.String({ pattern: "^(?!zettel_).*" }),
		zettel_key: Key,
	},
	{
		additionalProperties: true,
		propertyNames: Type.String({ pattern: "^(?!zettel_).*|^zettel_key$" }),
	}
);

export type CustomMark = Static<typeof CustomMark> & { [property: string]: any };

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
 *     "type": "zettel_span",
 *     "zettel_key": "uniqueKey",
 *     "marks": ["zettel_bold", "93j9jas09j2"],
 *     "text": "Hello world"
 *   }
 *   ```
 */
export type ZettelSpan = Static<typeof ZettelSpan>;
const ZettelSpan = Type.Object({
	type: Type.Literal("zettel_span"),
	zettel_key: Key,
	marks: Type.Optional(
		Type.Array(Type.Union([ZettelBoldMark, ZettelItalicMark, ZettelLinkMark, CustomMark]))
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
 *       "type": "zettel_text_block",
 *       "zettel_key": "uniqueKey",
 *       "style": "zettel_normal",
 *       "children": [
 *         {
 *           "type": "zettel_span",
 *           "zettel_key": "uniqueKey",
 *           "text": "Hello world"
 *         }
 *       ]
 *     }
 *   ]
 *   ```
 */
export type ZettelTextBlock = Static<typeof ZettelTextBlock> & { [property: string]: any };
const ZettelTextBlock = Type.Object({
	type: Type.Literal("zettel_text_block"),
	zettel_key: Key,
	style: Type.Union([
		Type.Literal("zettel_normal"),
		Type.String({
			description:
				"The key of a custom block. Renderers that don't support this block will render it as a zettel_normal block.",
		}),
	]),
	children: Type.Array(ZettelSpan, {
		description: "Array of inline spans that make up the block content",
	}),
	metadata: Metadata,
});

// Custom block: any block not a text-block, with basic node props, and no extra zettel_* props
const CustomBlock = Type.Intersect([
	Type.Object(
		{
			type: Type.String({ pattern: "^(?!zettel_text_block$).*" }),
			zettel_key: Key,
		},
		{
			propertyNames: Type.String({ pattern: "^(?!zettel_).*|^zettel_key$" }),
			additionalProperties: true,
		}
	),
	Type.Record(Type.String({ pattern: "^(?!zettel_).*|^zettel_key$" }), Type.Unknown()),
]);
export type CustomBlock = Static<typeof CustomBlock> & { [property: string]: any };

export type ZettelDoc = Static<typeof ZettelDoc>;
// A document is an object with type 'zettel_doc' and content array of text blocks or custom blocks
const ZettelDoc = Type.Object({
	type: Type.Literal("zettel_doc"),
	content: Type.Array(Type.Union([ZettelTextBlock, CustomBlock])),
});

export const ZettelDocJsonSchema = ZettelDoc;
