// Remove mdast dependency; operate on structural shapes

export type PMMark = {
	type: "bold" | "italic" | "strike" | "code" | "link"
	attrs?: Record<string, any>
}
export type PMNode = {
	type: string
	attrs?: Record<string, any>
	content?: PMNode[]
	text?: string
	marks?: PMMark[]
}

export function tiptapDocToAst(doc: PMNode): any {
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
			return {
				type: "list",
				ordered: false,
				children: (node.content || []).map(pmBlockToAst),
			} as any
		case "orderedList": {
			const out: any = {
				type: "list",
				ordered: true,
				children: (node.content || []).map(pmBlockToAst),
			}
			if (node.attrs?.start != null && node.attrs.start !== 1) out.start = node.attrs.start
			return out
		}
		case "listItem": {
			const out: any = { type: "listItem", children: (node.content || []).map(pmBlockToAst) }
			if (node.attrs && (node.attrs.checked === true || node.attrs.checked === false))
				out.checked = node.attrs.checked
			return out
		}

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
		case "table": {
			const align = node.attrs?.align ?? []
			return {
				type: "table",
				align,
				children: (node.content || []).map(pmBlockToAst),
			} as any
		}
		case "tableRow":
			return { type: "tableRow", children: (node.content || []).map(pmBlockToAst) }
		case "tableCell":
			return { type: "tableCell", children: pmInlineToMd(node.content || []) }
		default:
			if (node.content && node.content.length && isInline(node.content[0] as any)) {
				return { type: "paragraph", children: pmInlineToMd(node.content) }
			}
			return { type: "paragraph", children: [] }
	}
}

function pmInlineToMd(nodes: PMNode[]): any[] {
	const out: any[] = []
	for (const n of nodes) {
		if (n.type === "text") {
			out.push(applyMarksToText(n.text || "", n.marks || []))
		} else if (n.type === "hardBreak") {
			out.push({ type: "break" } as any)
		} else if (n.type === "image") {
			const src = n.attrs?.src ?? null
			const title = n.attrs?.title ?? null
			const alt = n.attrs?.alt ?? null
			out.push({ type: "image", url: src, title, alt } as any)
		}
	}
	return out
}

function applyMarksToText(value: string, marks: PMMark[]): any {
	let node: any = { type: "text", value } as any
	const order: PMMark["type"][] = ["bold", "italic", "strike", "code", "link"]
	for (const t of order) {
		if (marks.find((m) => m.type === t)) {
			if (t === "bold") node = { type: "strong", children: [node] } as any
			else if (t === "italic") node = { type: "emphasis", children: [node] } as any
			else if (t === "strike") node = { type: "delete", children: [node] } as any
			else if (t === "code") node = { type: "inlineCode", value } as any
			else if (t === "link") {
				const mark = marks.find((m) => m.type === "link")!
				const href = mark.attrs?.href ?? null
				const title = mark.attrs?.title ?? null
				node = { type: "link", url: href, title, children: [node] } as any
			}
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
