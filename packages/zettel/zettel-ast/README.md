# Zettel

A **portable, extendable JSON‑based rich‑text format** that works everywhere — comments, issues, docs.

> **Zettel** is the German word for “A scrap of paper that anything can be written on.”

https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312

---

## Why another AST?

No standard rich‑text AST exists. Everyone reinvents the wheel with no interop, no ecosystem, and no shared components.

| Pain today                                                                                     | Zettel fix                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| [Markdown & HTML are unsuited](https://www.smashingmagazine.com/2022/02/thoughts-on-markdown/) | Explicit JSON nodes                  |
| Every app invents a custom AST                                                                 | Single shared spec                   |
| Editor‑tied ASTs (Slate, Lexical, …) are not portable                                          | Editor‑agnostic, storage‑first model |

---

## Core design principles

**One‑sentence spec** → A Zettel document is an array of blocks. `zettel.textBlock` holds inline spans; spans reference `markDefs` for links, mentions, or custom marks; everything else lives in `metadata` or your own namespaced types.

- **Flat block array** → easy diff / CRDT / streaming.
- **Namespaced types** → `zettel.*` is guaranteed; anything else is vendor land.
- **Marks + markDefs** → bold / italic / link / mention without deep nesting.
- **`metadata` escape‑hatch** → extend safely; successful fields can graduate into the spec.

---

## Built‑in nodes (v‑1)

| `_type`                      | purpose                     | key fields                                 |
| ---------------------------- | --------------------------- | ------------------------------------------ |
| `zettel.textBlock`           | paragraphs, headings, lists | `style`, `children`, `listItem?`, `level?` |
| `zettel.span`                | inline text                 | `text`, `marks?`                           |
| `zettel.link` _(markDef)_    | hyperlink                   | `href`                                     |
| `zettel.mention` _(markDef)_ | cross‑entity reference      | `referenceId`, `entityType`, `name`        |

> **Fallback rule** If a viewer doesn’t recognise a custom mark or block, it’s ignored and raw text is shown — so custom mentions never break copy‑paste.

---

### Minimal document

> Have you seen [this](https://example.com)?

```json
[
	{
		"_type": "zettel.textBlock",
		"style": "zettel.normal",
		"children": [
			{ "_type": "zettel.span", "text": "Hello world, have you seen ", "marks": [] },
			{ "_type": "zettel.span", "text": "this", "marks": ["039jsj3"] },
			{ "_type": "zettel.span", "text": "?", "marks": [] }
		],
		"markDefs": [{ "_key": "039jsj3", "_type": "zettel.link", "href": "https://example.com" }]
	}
]
```

---

## Extending Zettel

### 1 · Custom inline mark

```json
{ "_key": "9j39ja", "_type": "acme.flag", "emoji": "🚩" }
```

### 2 · Use it in a span

```json
{ "_type": "zettel.span", "text": "important", "marks": ["9j39ja"] }
```

| viewer            | output      |
| ----------------- | ----------- |
| acme‑aware editor | 🚩important |
| Generic viewer    | important   |

> **Note:** Custom marks such as `acme.flag` are ignored by generic viewers, but the underlying text is still rendered, ensuring the content remains readable even without specialized support.

### 3 · Custom block

```json
{ "_type": "acme.codeBlock", "code": "console.log()", "language": "js" }
```

| viewer            | output        |
| ----------------- | ------------- |
| acme‑aware editor | console.log() |
| Generic viewer    | <ignored>     |

---

### Inspiration

Based on [Portable Text](https://portabletext.org/) — Zettel keeps its flat, JSON‑native shape and adds a shared vocabulary plus safe namespacing.
