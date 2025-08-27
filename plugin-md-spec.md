# Lix Markdown Plugin v2 — ID Matching (Concise)

## Goal

- Reliably match pasted/edited Markdown (no inline IDs) to existing nodes in Lix state and preserve identity across edits/moves.

## Identity

- Node identity lives at `node.data.id` (mdast‑standard extension point). No `mdast_id` property.
- Changes use `change.entity_id === node.data.id`.

## Parser/Serializer

- Use `@opral/markdown-wc`:
  - `parseMarkdown(markdown) → mdast Root` (no IDs added).
  - `serializeAst(root) → markdown` (ignores `node.data`, does not throw).
- The plugin does not re‑export these; it just consumes them.

## Schemas

- Nodes: use `markdown-wc` schemas per node type (`AstSchemas.schemasByType[type]`).
- Root order: plugin‑local minimal schema `{ order: string[] }` to track top‑level ordering.
  - Detect/Apply map this plugin root to a markdown-wc root only for parse/serialize boundaries:
    - Detect: parse Markdown to a markdown-wc Root AST (no IDs) and reconcile IDs; plugin persists order via the custom root schema.
    - Apply: read plugin root order + node snapshots → build a markdown-wc Root AST in-memory → serialize with `serializeAst`.

## Detect Changes (inputs)

- `beforeState: StateRow[]` (snapshot of prior MD state for the file).
- `after: { data: Uint8Array }` (new Markdown bytes).

## Matching Strategy (initial)

- Parse `afterMarkdown` → `afterAst`.
- Build `before` index from `beforeState` (markdown‑wc node rows). Key by `type + fingerprint(node)`.
- Fingerprint = JSON of node with `data/position` removed; type‑scoped.
- For each top‑level `afterAst.children`:
  - Match by type+fingerprint to an unused `before` node → inherit `data.id`.
  - If no match → mint new id (e.g., hash of type+fingerprint).
- Generate changes:
  - Deletions: ids in `before` not present in `after`.
  - Adds/Mods: for each `after` id, if new or fingerprint differs → emit snapshot.
  - Order: compare previous `order` (if present in state) to new order; emit root change on difference.

Notes
- Keep matching type‑scoped. Ignore `position`/`data` when comparing content.
- Ambiguity: prefer safety (mint new id) over incorrect re‑use.

## Acceptance

- Serializer never throws and ignores `node.data`.
- `entity_id === node.data.id` for all emitted node changes.
- Matching works for simple edits/moves; ambiguous duplicates do not mis‑map.
