import type { Extensions } from "@tiptap/core"
import { markdownWcNodes } from "./nodes.js"

// --- TipTap minimal extensions (no HTML parsing, schema only) ---

export function markdownWcExtensions(): Extensions {
	return markdownWcNodes()
}
