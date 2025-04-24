import { Type, type Static } from "@sinclair/typebox";

/**
 * A Base Node (modeled after [Portable Text](https://github.com/portabletext/portabletext)).
 *
 * A node always has to have a `_type` and a `_key`.
 */
export type ZettelNode = Static<typeof BaseNode> & { [property: string]: any };
const BaseNode = Type.Object({
  _type: Type.String(),
  _key: Type.String({
    description: "Unique key for this node within the document",
  }),
});

const Metadata = Type.Optional(Type.Record(Type.String(), Type.Unknown()));

export type ZettelLinkMark = Static<typeof ZettelLinkMark>;
const ZettelLinkMark = Type.Object({
  _key: Type.String({}),
  _type: Type.Literal("zettel_link"),
  href: Type.String({
    description: "The target URL of the link",
  }),
  metadata: Metadata,
});

export type ZettelBoldMark = Static<typeof ZettelBoldMark>;
const ZettelBoldMark = Type.Object({
  _key: Type.String({}),
  _type: Type.Literal("zettel_bold"),
});

export type ZettelItalicMark = Static<typeof ZettelItalicMark>;
const ZettelItalicMark = Type.Object({
  _key: Type.String({}),
  _type: Type.Literal("zettel_italic"),
});

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
  _type: Type.Literal("zettel_span"),
  _key: Type.String(),
  marks: Type.Optional(
    Type.Array(Type.Union([ZettelBoldMark, ZettelItalicMark, ZettelLinkMark])),
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
 *       "_type": "zettel_text_block",
 *       "_key": "uniqueKey",
 *       "style": "zettel_normal",
 *       "children": [
 *         {
 *           "_type": "zettel_span",
 *           "_key": "uniqueKey",
 *           "text": "Hello world"
 *         }
 *       ]
 *     }
 *   ]
 *   ```
 */
export type ZettelTextBlock = Static<typeof ZettelTextBlock>;
const ZettelTextBlock = Type.Object({
  _type: Type.Literal("zettel_text_block"),
  _key: Type.String(),
  style: Type.Union([
    Type.Literal("zettel_normal"),
    Type.Literal("zettel_h1"),
    Type.Literal("zettel_h2"),
    Type.Literal("zettel_h3"),
    Type.String({
      description:
        "The key of a custom block. Renderers that don't support this block will render it as a zettel.normal block.",
    }),
  ]),
  children: Type.Array(ZettelSpan, {
    description: "Array of inline spans that make up the block content",
  }),
  metadata: Metadata,
});

// Represents any block that is *not* a ZettelTextBlock but has the basic node requirements
const CustomBlock = Type.Intersect([
  BaseNode, // Must have _type and _key
  Type.Object({
    _type: Type.Not(Type.Literal("zettel_text_block")), // _type cannot be zettel_text_block
  }),
  // Forbid _key starting with '_'
  Type.Object({
    _key: Type.String({ pattern: "^[^_].*" }),
  }),
]);

export type ZettelDoc = Array<ZettelTextBlock | ZettelNode>;
// A document is an array of either ZettelTextBlocks or CustomBlocks
const ZettelDoc = Type.Array(Type.Union([ZettelTextBlock, CustomBlock]));

export const ZettelDocJsonSchema = ZettelDoc;
