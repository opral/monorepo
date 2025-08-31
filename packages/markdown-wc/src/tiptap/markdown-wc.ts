import type { Extensions } from "@tiptap/core"
import { markdownWcNodes } from "./nodes.js"
import { createAssignDataIdExtension } from "./assign-data-id.js"

// --- TipTap minimal extensions (no HTML parsing, schema only) ---

/**
 * Build the minimal TipTap extension set for Markdown‑WC.
 *
 * - Schema-only nodes/marks for Markdown editing (no UI/menus included).
 * - Preserves arbitrary vendor metadata via `attrs.data` on nodes/marks.
 * - Ensures each top‑level block has a stable `data.id` to support
 *   identity/persistence across edits (splits/inserts get a new id).
 *
 * Identity provider
 * - By default, a small local generator is used (readable, dependency‑free).
 * - You can inject your own `idProvider` to align with your app/runtime.
 *
 * Examples
 * ```ts
 * import { markdownWcExtensions } from "@opral/markdown-wc/tiptap"
 * import { Editor } from "@tiptap/core"
 *
 * // 1) Default ids (sufficient for most apps/tests)
 * const editor = new Editor({
 *   extensions: markdownWcExtensions(),
 * })
 *
 * // 2) Integrate with Lix nanoId for persistence alignment
 * import { nanoId } from "@lix-js/sdk"
 * const editor2 = new Editor({
 *   extensions: markdownWcExtensions({ idProvider: () => nanoId({ lix }) }),
 * })
 *
 * // 3) Deterministic ids in tests
 * let i = 0
 * const editor3 = new Editor({
 *   extensions: markdownWcExtensions({ idProvider: () => `test_${i++}` }),
 * })
 * ```
 */
export function markdownWcExtensions(opts?: { idProvider?: () => string }): Extensions {
	return [...markdownWcNodes(), createAssignDataIdExtension(opts)]
}
