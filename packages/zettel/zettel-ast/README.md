# Zettel

A **portable JSON-based rich text AST** to enable interoperability between apps, rich text editors, and storage formats.

> **Zettel** is German for "a scrap of paper that anything can be written on."

Zettel is the outcome of analyzing numerous rich text ASTs and editors. No common AST exists to express rich text. Zettel aims to become this shared spec for rich text, just like Markdown is for plain text.

## 🧩 Why Zettel?

One rich text document format. Many editors. Zero reinventing the wheel.

- 📦 Portable — serialize anywhere, validate everywhere
- 🔧 Extensible — just define new `type` nodes
- 🧘 Flexible — unknown nodes won’t break your app
- 📐 Structured — shared schema, unique keys, typed marks

### Problems of existing solutions (and how Zettel solves them)

| Problem                                                                                        | Zettel Fix                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| [Markdown & HTML are unsuited](https://www.smashingmagazine.com/2022/02/thoughts-on-markdown/) | Explicit JSON nodes                  |
| Every app builds its own AST                                                                   | Shared spec with extensibility       |
| Editor-tied formats like Slate/Lexical can't be shared                                         | Editor-agnostic, storage-first model |
| Other spec's don't define common nodes                                                         | `zettel_*` node spec with guarantees |

## 🚚 Interoperability Principles

| Principle                     | Practice                                                                | Why it matters                                    |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| **1. Single wrapper**         | Root node: `{ type: "zettel_doc", content: [...] }`                     | Recognizable file type, room for metadata         |
| **2. Universal keys**         | Every node/mark has a unique `zettel_key`                               | Enables merging, diffing, comments, anchoring     |
| **3. Flat block array**       | Top-level `content` is always an array                                  | Easy to stream, diff, or patch                    |
| **4. Namespaced types**       | Built-ins use `zettel_*`; everything else is vendor space               | Tools can skip unknowns, preserve them round-trip |
| **5. Graceful fallback**      | Unknown blocks are ignored; unknown marks are stripped but text remains | Always renders, even with unknown content         |
| **6. JSON Schema validation** | Canonical spec with runtime validation + TS types                       | Fail fast, validate early, ensure compatibility   |

## 🔄 What graceful fallback looks like

| Original JSON                                                              | Viewer knows it?  | Render result                  |
| -------------------------------------------------------------------------- | ----------------- | ------------------------------ |
| `{ "type": "custom_video_viewer", "src": "…" }`                            | ✅ Yes            | Inline video player            |
| same                                                                       | ❌ No             | `<div>Unsupported block</div>` |
| `{ "type": "zettel_span", text: "@Max", marks: [{type: "acme_mention"}] }` | ✅ Custom editor  | `@Max` (styled mention)        |
| same                                                                       | ❌ Generic editor | `@Max` (plain text)            |

> ✅ Text is never lost. Unknown nodes are preserved and round-tripped safely.

## 🧠 Core Design

Zettel is designed for easy parsing, transformation, and interoperability.

- **Flat block list** — no nested trees
- **Editor-agnostic** — serialize anywhere, render everywhere
- **Typed nodes** — built-in types use the `zettel_` prefix
- **Every node has a unique key** — great for diffs, comments, and syncing

### 🧾 Node rules (spec)

Every node MUST contain:

- `type` (string) – a namespaced identifier (e.g. "zettel_text_block", "acme_widget")
- `zettel_key` (string) – a unique key within the document

All other Zettel-reserved properties start with the `zettel_*` prefix. This ensures future compatibility and avoids naming collisions.

## 🧱 Built-in Nodes

### `zettel_text_block`

```ts
{
  type: "zettel_text_block",
  zettel_key: "id",
  style: "zettel_normal", // or zettel_h1, zettel_quote, etc.
  children: [ZettelSpan]
}
```

### `zettel_span`

```ts
{
  type: "zettel_span",
  zettel_key: "id",
  text: "Hello",
  marks: [ZettelMark]
}
```

#### Mark examples

```ts
{ type: "zettel_bold",   zettel_key: "m1" }
{ type: "zettel_italic", zettel_key: "m2" }
{ type: "zettel_link",   zettel_key: "m3", href: "https://…" }
```

## ✨ Examples

### Basic text block

```json
{
	"type": "zettel_doc",
	"content": [
		{
			"type": "zettel_text_block",
			"zettel_key": "x1",
			"style": "zettel_normal",
			"children": [
				{
					"type": "zettel_span",
					"zettel_key": "s1",
					"text": "Hello, world!",
					"marks": []
				}
			]
		}
	]
}
```

### Rich marks

```json
{
	"type": "zettel_span",
	"zettel_key": "s2",
	"text": "link",
	"marks": [{ "type": "zettel_link", "zettel_key": "m1", "href": "https://example.com" }]
}
```

### Custom marks

```json
{
	"type": "zettel_span",
	"zettel_key": "s3",
	"text": "@alice",
	"marks": [{ "type": "custom_mention", "zettel_key": "mention1", "id": "alice" }]
}
```

## 🔧 Extending Zettel

You can define custom marks or blocks.

### Custom mark example

```ts
{
  type: "emoji_mark",
  zettel_key: "m4",
  emoji: "🚩"
}
```

### Use it in a span

```ts
{
  type: "zettel_span",
  zettel_key: "s1",
  text: "important",
  marks: [{ type: "emoji_mark", zettel_key: "m4", emoji: "🚩" }]
}
```

### Custom block example

```ts
{
  type: "code_block",
  zettel_key: "cb1",
  code: "console.log()",
  language: "js"
}
```

_Generic editors will skip unknown blocks, but text remains readable and round-trappable._
