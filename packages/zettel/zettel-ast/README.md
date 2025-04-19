# Zettel AST

**Zettel** (German for "a piece of paper on which anything can be written") is a standard, portable AST for rich text that enables interoperability across different products.

## Use case

Zettel is ideal for implementing rich text features such as mentions, links, bold, italic, lists, and more — in **comments**, **issue trackers**, **documents**, and any structured content system.

## Why Zettel?

https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312

### Problem

No standard, editor-independent rich text AST exists. Most products re-invent their own rich text data model, which:

- Leads to fragmentation across tools
- Prevents rich copy-paste or shared components
- Blocks collaboration and structured diffing

Existing approaches fall short:

- [Markdown is unsuited for rich text](https://www.smashingmagazine.com/2022/02/thoughts-on-markdown/)
- HTML is unsafe and platform-specific (`dangerouslySetInnerHTML`)
- Editor-specific ASTs (e.g., ProseMirror, Slate) are tightly coupled to their editor runtime

### Solution

**Zettel** defines a simple, portable, and extensible AST — modeled after Portable Text — but with an opinionated, namespaced core vocabulary defined in the **Zettel Spec**.

## Goals

- Define a **standard vocabulary of nodes** for core rich text features
- Ensure **extensibility** via namespaced custom types
- Be **portable** and persistable as plain JSON
- Remain **unopinionated** about rendering and storage

## Out of scope

- Persistence of referenced assets (e.g. images, files)
- Rendering logic or styling of nodes

## Architecture

Zettel defines two core node types:

- `zettel.block` — a top-level block (paragraph, heading, quote, etc.)
- `zettel.span` — inline content within a block (text, inline marks)

Each node includes a `metadata` field for structured extensibility. This prevents top-level property collisions and allows gradual spec evolution. If a majority of use cases store a property in the `metadata` field, it will eventually be added to the Zettel spec itself.

---

## 📊 Zettel Spec

The **Zettel Spec** defines a required vocabulary of styles, marks, and markDefs that all Zettel-compliant tools must support. It ensures consistent behavior across tools while remaining extensible.

---

### Text Block (`zettel.textBlock`)

| Style | Description |
|-------|-------------|
| `zettel.normal` | Paragraph text |
| `zettel.h1`        | Heading level 1 |
| `zettel.h2`        | Heading level 2 |

#### Inline Marks (`zettel.textBlock.marks[]`)

| Mark | Description |
|------|-------------|
| `zettel.strong` | Bold |
| `zettel.italic`     | Italic |
| `zettel.link`   | Link (via `markDefs`) |
| `zettel.accountMention`| Mention (via `markDefs`) |

---

#### Mark Definitions (`zettel.textBlock.markDefs[]`)

#### `zettel.link`

```json
{
  "_key": "<unique-key>",
  "_type": "zettel.link",
  "href": "https://example.com"
}
```

#### `zettel.accountMention`

```json
{
  "_key": "<unique-key>",
  "_type": "zettel.accountMention",
  "id": "user_123",
  "metadata": {
    "zettel.avatarUrl": "https://example.com/avatar.jpg",
    "role": "editor"
  }
}
```

---

### 🧰 Extensibility Guidelines

Either define a custom type or use metadata.

- Custom types **must not** use the `zettel.` prefix.
- All non-standard properties **must** be placed in the `metadata` object when placed in a Zettel node.

```json
[
  {
    // Use metadata in Zettel nodes
    "_type": "zettel.textBlock",
    "_key": "<unique-key>",
    "metadata": {
      "papier.viewMode": "edit",
      "acme.tag": "important"
    }
  },
  {
    // Use custom types outside of Zettel nodes
    "_type": "<namespace>.type",
    "_key": "<unique-key>",
    "foo": "bar"
  }
]
```


---

### 📄 Example AST

```json
[
  {
    "_key": "<unique-key>",
    "_type": "zettel.textBlock",
    "style": "zettel.h1",
    "children": [
      {
        "_key": "<unique-key>",
        "_type": "zettel.span",
        "text": "Hello, ",
        "marks": []
      },
      {
        "_key": "<unique-key>",
        "_type": "zettel.span",
        "text": "World!",
        "marks": ["zettel.strong"]
      }
    ],
    "markDefs": [],
    "metadata": {}
  },
  {
    "_key": "<unique-key>",
    "_type": "zettel.textBlock",
    "style": "zettel.normal",
    "children": [
      {
        "_key": "<unique-key>",
        "_type": "zettel.span",
        "text": "This is a paragraph with a ",
        "marks": []
      },
      {
        "_key": "<unique-key>",
        "_type": "zettel.span",
        "text": "mention",
        "marks": ["<mention-key>"]
      }
    ],
    "markDefs": [
      {
        "_key": "<mention-key>",
        "_type": "zettel.accountMention",
        "id": "user_123"
      }
    ],
    "metadata": {}
  }
]
```

---

### 💡 Inspiration

Zettel is inspired by [Portable Text](https://portabletext.org/), which offers a flexible JSON representation of rich text.

Zettel builds on that foundation by:

- Defining a **shared vocabulary** for guaranteed interoperability  
- Introducing **namespaced conventions** for core semantics  
- Encouraging **extensibility** through clearly scoped custom types and `metadata` fields

