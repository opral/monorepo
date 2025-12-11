import { unified, type Plugin } from "unified"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { visit } from "unist-util-visit"
import { rehypeGithubAlerts } from "./rehype-github-alerts.js"
import { rehypeCodeBlocks } from "./rehype-codeblocks.js"
import {
	remarkExternalLinks,
	type ExternalLinksOptions,
} from "../remark-external-links.js"

export type SerializeToHtmlOptions = {
	/**
	 * When true, embed diff-related hints to optimize downstream HTML diff rendering.
	 *
	 * Can be used with https://html-diff.lix.dev/
	 *
	 * @default false.
	 */
	diffHints?: boolean
	/**
	 * When enabled, external links open in a new tab and get a safe rel.
	 *
	 * `true` applies defaults to all absolute http(s) links (treated as external).
	 * Mirrors the `parse()` option.
	 *
	 * @default false
	 */
	externalLinks?: boolean | ExternalLinksOptions
}

// Public API: serialize Ast (mdast-shaped) to HTML string
export async function serializeToHtml(
	ast: any,
	options: SerializeToHtmlOptions = {}
): Promise<string> {
	const withDefaults: SerializeToHtmlOptions = {
		diffHints: false,
		externalLinks: false,
		...options,
	}
	// Single-pass remark plugin to serialize mdast data.* to HTML data-* and loosen lists
	// - Make lists "loose" so list items render paragraphs inside <li>
	// - Promote node.data.* to hProperties data-* attributes
	const remarkSerializeDataAttributes: Plugin<[], any> = () => (tree: any) => {
		visit(tree, (node: any, _index: number | null | undefined, parent: any) => {
			if (!node || typeof node !== "object") return
			// loose lists
			if (node.type === "list" || node.type === "listItem") (node as any).spread = true
			// diff hints: set diff attributes when requested (non-destructive: don't override if present)
			if (withDefaults.diffHints) {
				const diffData = ((node as any).data ||= {}) as Record<string, any>
				const parentIsListItem = parent?.type === "listItem"
				if (node.type === "listItem" && diffData["diff-mode"] == null) {
					diffData["diff-mode"] = "element"
				}
				const supportsWordDiff =
					node.type === "paragraph" || node.type === "heading" || node.type === "tableCell"
				if (!parentIsListItem && supportsWordDiff) {
					if (diffData["diff-mode"] == null) diffData["diff-mode"] = "words"
				}
				if (diffData["id"] != null && diffData["diff-show-when-removed"] == null) {
					diffData["diff-show-when-removed"] = ""
				}
			}
			// data -> data-*
			const d = (node as any).data
			if (d && typeof d === "object") {
				const h = (((node as any).data as any).hProperties ||= {}) as Record<string, any>
				for (const [k, v] of Object.entries(d)) {
					if (k === "hProperties") continue
					if (v == null) continue
					const t = typeof v
					if (t === "string" || t === "number" || t === "boolean") {
						const attrName = k === "id" ? "data-diff-key" : `data-${k}`
						h[attrName] = String(v)
					}
				}
			}
		})
	}
	// mdast -> hast
	const processor = unified().use(remarkSerializeDataAttributes as any)
	if (withDefaults.externalLinks) {
		if (typeof withDefaults.externalLinks === "object") {
			processor.use(remarkExternalLinks as any, withDefaults.externalLinks)
		} else {
			processor.use(remarkExternalLinks as any)
		}
	}

	const hast = await processor
		.use(remarkRehype as any, { allowDangerousHtml: true })
		.use(rehypeGithubAlerts as any)
		.use(rehypeCodeBlocks as any)
		.run(ast)

	if (withDefaults.diffHints) {
		addWrapperIdsToTables(hast)
	}
	// hast -> html
	const html = unified()
		.use(rehypeStringify, { allowDangerousHtml: true })
		.stringify(hast as any)
	// Normalize newlines to compact form matching TipTap's getHTML()
	return String(html).replace(/\n/g, "")
}

function addWrapperIdsToTables(tree: any) {
	visit(tree, (node: any) => {
		if (!node || node.type !== "element" || node.tagName !== "table") return
		const tableId =
			typeof node.properties?.["data-diff-key"] === "string"
				? (node.properties["data-diff-key"] as string)
				: undefined
		if (!tableId) return
		for (const child of node.children ?? []) {
			if (!child || child.type !== "element") continue
			const tag = child.tagName
			if (tag !== "thead" && tag !== "tbody" && tag !== "tfoot") continue
			const props = (child.properties ||= {})
			if (props["data-diff-key"]) continue
			props["data-diff-key"] = `${tableId}_${tag}`
			if (props["data-diff-show-when-removed"] == null) {
				props["data-diff-show-when-removed"] = ""
			}
		}
	})
}
