import { unified, type Plugin } from "unified"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { visit } from "unist-util-visit"

export type SerializeToHtmlOptions = {
	/**
	 * When true, embed diff-related hints to optimize downstream HTML diff rendering.
	 *
	 * Can be used with https://html-diff.lix.dev/
	 *
	 * @default false.
	 */
	diffHints?: boolean
}

// Public API: serialize Ast (mdast-shaped) to HTML string
export async function serializeToHtml(
	ast: any,
	options: SerializeToHtmlOptions = {}
): Promise<string> {
	// Single-pass remark plugin to serialize mdast data.* to HTML data-* and loosen lists
	// - Make lists "loose" so list items render paragraphs inside <li>
	// - Promote node.data.* to hProperties data-* attributes
	const remarkSerializeDataAttributes: Plugin<[], any> = () => (tree: any) => {
		visit(tree, (node: any) => {
			if (!node || typeof node !== "object") return
			// loose lists
			if (node.type === "list" || node.type === "listItem") (node as any).spread = true
			// diff hints: set diff attributes when requested (non-destructive: don't override if present)
			if (options.diffHints) {
				const diffData = ((node as any).data ||= {}) as Record<string, any>
				if (node.type === "paragraph" || node.type === "heading" || node.type === "tableCell") {
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
						h[`data-${k}`] = String(v)
					}
				}
			}
		})
	}
	// mdast -> hast
	const hast = await unified()
		.use(remarkSerializeDataAttributes as any)
		.use(remarkRehype as any, { allowDangerousHtml: true })
		.run(ast)

	if (options.diffHints) {
		addWrapperIdsToTables(hast)
		addCheckboxIdsToTaskLists(hast)
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
			typeof node.properties?.["data-id"] === "string"
				? (node.properties["data-id"] as string)
				: undefined
		if (!tableId) return
		for (const child of node.children ?? []) {
			if (!child || child.type !== "element") continue
			const tag = child.tagName
			if (tag !== "thead" && tag !== "tbody" && tag !== "tfoot") continue
			const props = (child.properties ||= {})
			if (props["data-id"]) continue
			props["data-id"] = `${tableId}_${tag}`
			if (props["data-diff-show-when-removed"] == null) {
				props["data-diff-show-when-removed"] = ""
			}
		}
	})
}

function addCheckboxIdsToTaskLists(tree: any) {
	visit(tree, (node: any) => {
		if (!node || node.type !== "element" || node.tagName !== "li") return
		const parentId =
			typeof node.properties?.["data-id"] === "string"
				? (node.properties["data-id"] as string)
				: undefined
		if (!parentId) return
		let checkboxIndex = 0
		const assign = (child: any) => {
			if (!child || typeof child !== "object") return
			if (child.type === "element") {
				if (child.tagName === "input") {
					const props = (child.properties ||= {}) as Record<string, unknown>
					const inputType =
						typeof props.type === "string"
							? (props.type as string).toLowerCase()
							: ""
					if (inputType === "checkbox") {
						if (typeof props["data-id"] !== "string" || props["data-id"] === "") {
							const suffix = checkboxIndex === 0 ? "" : `_${checkboxIndex + 1}`
							props["data-id"] = `${parentId}_checkbox${suffix}`
						}
						if (props["data-diff-show-when-removed"] == null) {
							props["data-diff-show-when-removed"] = ""
						}
						if (props["data-diff-mode"] == null) {
							props["data-diff-mode"] = "element"
						}
						checkboxIndex++
					}
				}
				for (const grandchild of child.children ?? []) {
					assign(grandchild)
				}
			}
		}
		for (const child of node.children ?? []) {
			assign(child)
		}
	})
}
