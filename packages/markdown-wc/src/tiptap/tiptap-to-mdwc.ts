import type { Root as MdRoot, PhrasingContent as MdPhrasing } from "mdast"

export type PMMark = { type: "bold" | "italic" | "strike" | "code" }
export type PMNode = {
	type: string
	attrs?: Record<string, any>
	content?: PMNode[]
	text?: string
	marks?: PMMark[]
}

export function tiptapDocToMarkdownWcAst(doc: PMNode): MdRoot {
	return { type: "root", children: (doc.content || []).map(pmBlockToAst) } as any
}

function pmBlockToAst(node: PMNode): any {
	switch (node.type) {
		case "paragraph":
			return { type: "paragraph", children: pmInlineToMd(node.content || []) }
		case "heading":
			return {
				type: "heading",
				depth: node.attrs?.level || 1,
				children: pmInlineToMd(node.content || []),
			}
		case "bulletList":
			return { type: "list", ordered: false, children: (node.content || []).map(pmBlockToAst) }
		case "orderedList": {
			const out: any = {
				type: "list",
				ordered: true,
				children: (node.content || []).map(pmBlockToAst),
			}
			if (node.attrs?.start != null && node.attrs.start !== 1) out.start = node.attrs.start
			return out
		}
		case "listItem":
			return { type: "listItem", children: (node.content || []).map(pmBlockToAst) }
		case "blockquote":
			return { type: "blockquote", children: (node.content || []).map(pmBlockToAst) }
		case "codeBlock": {
			const text = collectText(node.content || [])
			const lang = node.attrs?.language
			const out: any = { type: "code", value: text }
			if (lang != null) out.lang = lang
			return out
		}
		case "horizontalRule":
			return { type: "thematicBreak" }
		default:
			if (node.content && node.content.length && isInline(node.content[0])) {
				return { type: "paragraph", children: pmInlineToMd(node.content) }
			}
			return { type: "paragraph", children: [] }
	}
}

function pmInlineToMd(nodes: PMNode[]): MdPhrasing[] {
	const out: MdPhrasing[] = []
	for (const n of nodes) {
		if (n.type === "text") {
			out.push(applyMarksToText(n.text || "", n.marks || []))
		} else if (n.type === "hardBreak") {
			out.push({ type: "break" } as any)
		}
	}
	return out
}

function applyMarksToText(value: string, marks: PMMark[]): MdPhrasing {
	let node: MdPhrasing = { type: "text", value } as any
	const order: PMMark["type"][] = ["bold", "italic", "strike", "code"]
	for (const t of order) {
		if (marks.find((m) => m.type === t)) {
			if (t === "bold") node = { type: "strong", children: [node] } as any
			else if (t === "italic") node = { type: "emphasis", children: [node] } as any
			else if (t === "strike") node = { type: "delete", children: [node] } as any
			else if (t === "code") node = { type: "inlineCode", value } as any
		}
	}
	return node
}

function isInline(n: PMNode) {
	return !n.content && (n.text != null || n.type === "hardBreak")
}

function collectText(nodes: PMNode[]): string {
	return (nodes || []).map((n) => (n.type === "text" ? n.text || "" : "")).join("")
}
