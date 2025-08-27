import type { Extensions } from "@tiptap/core"
import type { Root as MdRoot } from "mdast"
import { markdownWcNodes } from "./nodes.js"
import type { PMNode } from "./mdwc-to-tiptap.js"
import { markdownWcAstToTiptap } from "./mdwc-to-tiptap.js"
import { tiptapDocToMarkdownWcAst } from "./tiptap-to-mdwc.js"

// --- TipTap minimal extensions (no HTML parsing, schema only) ---

export function markdownWcExtensions(): Extensions {
	return markdownWcNodes()
}

// --- AST (mdast) ⇄ TipTap JSON mapping ---

export function astToTiptapDoc(ast: MdRoot): PMNode {
	return markdownWcAstToTiptap(ast)
}

export function tiptapDocToAst(doc: PMNode): MdRoot {
	return tiptapDocToMarkdownWcAst(doc)
}
