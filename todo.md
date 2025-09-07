# Test Plan: Bulletproof Editor and Persistence

This doc enumerates high‑impact unit tests to add across packages. We’ll
implement them incrementally — check items as we land them.

Legend

- [ ] pending
- [x] done

## packages/markdown-wc

Priority A (highest impact)

- [x] Enter split: start/middle/end + repeated

  - File: `packages/markdown-wc/src/tiptap/e2e.test.ts`
  - Goal: Press Enter at (start | middle | end) of a paragraph; then press Enter 2–3 more times.
  - Assert: number of paragraphs equals number of splits+1; all top‑level `data.id` values are unique; text halves are correct.
  - Notes: Use a deterministic `idProvider` (e.g., `MarkdownWc({ idProvider: () => ids[i++] })`).

- [x] Duplicate‑id autocorrection on boot

  - File: `packages/markdown-wc/src/tiptap/assign-data-id.test.ts` (new)
  - Goal: Initialize editor with two top‑level blocks sharing the same `data.id`.
  - Assert: After first `appendTransaction`, each top‑level block has a unique id.

- [x] Paste multi‑paragraph at caret
  - File: `packages/markdown-wc/src/tiptap/e2e.test.ts`
  - Goal: Start with one paragraph, paste "A\n\nB" at end and in the middle.
  - Assert: paragraphs texts are `[Hello, A, B]` (or split appropriately); all ids unique.

Priority B (robustness)

- [ ] Undo/Redo after Enter split preserves IDs

  - File: `packages/markdown-wc/src/tiptap/e2e.test.ts`
  - Goal: Split a paragraph, then undo and redo via keymap/commands.
  - Assert: paragraphs and ids are stable; no duplicate ids appear.

- [ ] Large‑scale Enter (N=50) — ids uniqueness and performance

  - File: `packages/markdown-wc/src/tiptap/e2e.test.ts`
  - Goal: Create 50 paragraphs via repeated Enter.
  - Assert: `childCount === 50`; `Set(ids).size === 50`.

- [x] Split with marks and trailing spaces

  - File: `packages/markdown-wc/src/tiptap/e2e.test.ts`
  - Goal: Split after bold/italic, and where the left side has trailing spaces.
  - Assert: left/right content correctness; ids unique.

- [x] Enter inside list items does not affect top‑level root ids
  - File: `packages/markdown-wc/src/tiptap/shortcuts.test.ts`
  - Goal: Create a list, press Enter inside items.
  - Assert: Top‑level blocks that carry ids remain unchanged (list is the top‑level block).

## packages/flashtype

Priority A (highest impact)

- [x] Rapid Enter/type coalescing persists correctly

  - File: `packages/flashtype/src/components/editor/create-editor.test.ts`
  - Goal: Simulate Enter + type, Enter + type with no awaits between commands.
  - Assert: DB `state` shows 3 paragraphs with expected texts and unique ids; root order references all ids.
  - Notes: Verifies serialized persistence (no overlapping transactions).

- [ ] Defense‑in‑depth duplicate id handling

  - File: `packages/flashtype/src/components/editor/create-editor.test.ts`
  - Goal: Manually inject duplicated `data.id` into the editor doc JSON, then trigger an update.
  - Assert: Before writing, Flashtype’s `ensureTopLevelIds` yields unique ids and persists them.

- [x] State cleanup on delete

  - File: `packages/flashtype/src/components/editor/create-editor.test.ts`
  - Goal: Delete the middle paragraph.
  - Assert: Its `state` row is removed; root order no longer references it.

- [ ] Root‑order only change excluded from change count (scales)
  - File: `packages/flashtype/src/queries.test.ts`
  - Goal: Larger doc reorder (e.g., 20 blocks).
  - Assert: `selectWorkingDiffCount` returns 0 while root order changes.

Priority B (scenarios)

- [ ] Paste multi‑paragraph → persisted paragraphs and texts

  - File: `packages/flashtype/src/components/editor/create-editor.test.ts`
  - Goal: Paste "A\n\nB" and ensure DB mirrors editor (texts + unique ids + root order).

- [ ] Checkpoint lifecycle

  - File: `packages/flashtype/src/components/change-indicator.test.tsx` or new
  - Goal: Create edits, checkpoint, verify counts reset; repeat.
  - Assert: numeric indicator matches `selectWorkingDiffCount` behavior.

- [ ] Active file switch during edits
  - File: `packages/flashtype/src/queries.test.ts`
  - Goal: Edit file A then switch active to file B mid‑stream.
  - Assert: counts remain scoped; no bleed between files.

## Implementation Notes

- Prefer `JSONContent` and `PMNode` types in TipTap tests; avoid `any`.
- Provide deterministic `idProvider` for assertions.
- Add small helpers for tests (can live inside test files):
  - `getParagraphTextsFromAst(ast: Ast): string[]`
  - `getTopLevelIdsFromAst(ast: Ast): string[]`
- Keep tests fast: no long timeouts; use small polling windows only where necessary (persistence).
