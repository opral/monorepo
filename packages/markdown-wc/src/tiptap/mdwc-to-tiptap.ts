import type {
	Root as MdRoot,
	Content as MdContent,
	PhrasingContent as MdPhrasing,
	Text as MdText,
} from "mdast"

export type PMMark = { type: "bold" | "italic" | "strike" | "code" | "link"; attrs?: Record<string, any> }
export type PMNode = {
	type: string
	attrs?: Record<string, any>
	content?: PMNode[]
	text?: string
	marks?: PMMark[]
}

export function astToTiptapDoc(ast: MdRoot): PMNode {
	return { type: "doc", content: ast.children.map(astBlockToPM) }
}

function astBlockToPM(node: MdContent): PMNode {
	switch (node.type) {
		case "paragraph":
			return { type: "paragraph", content: flattenInline((node as any).children || [], []) }
		case "heading":
			return {
				type: "heading",
				attrs: { level: (node as any).depth },
				content: flattenInline((node as any).children || [], []),
			}
		case "list": {
			const n = node as any
			const type = n.ordered ? "orderedList" : "bulletList"
			let attrs: any = undefined
			if (n.ordered && n.start != null && n.start !== 1) attrs = { start: n.start }

			// Mark bullet lists as task lists if any item has checked set
			if (!n.ordered) {
				const hasTask = Array.isArray(n.children)
					? n.children.some((li: any) => li && (li.checked === true || li.checked === false))
					: false
				attrs = { ...(attrs || {}), isTaskList: hasTask }
			}

			return { type, attrs, content: (n.children || []).map(astBlockToPM) }
		}
		case "listItem": {
			const n = node as any
			const hasChecked = n.checked === true || n.checked === false
			const attrs = hasChecked ? { checked: n.checked } : undefined
			return { type: 'listItem', attrs, content: (n.children || []).map(astBlockToPM) }
		}
		case "blockquote": {
			const n = node as any
			return { type: "blockquote", content: (n.children || []).map(astBlockToPM) }
		}
		case "code": {
			const n = node as any
			return {
				type: "codeBlock",
				attrs: { language: n.lang ?? null },
				content: textContent(n.value || ""),
			}
		}
		case "thematicBreak":
			return { type: "horizontalRule" }
		case "yaml":
			// Not represented in editor surface; drop
			return { type: "paragraph", content: textContent("") }
		default:
			// Fallback: paragraph of inline content if present
			// @ts-ignore
			if ((node as any).children)
				return { type: "paragraph", content: flattenInline((node as any).children, []) }
			return { type: "paragraph", content: textContent("") }
	}
}

function textContent(str: string): PMNode[] {
	return str ? [{ type: "text", text: str }] : []
}

function flattenInline(nodes: MdPhrasing[], active: PMMark[]): PMNode[] {
	const out: PMNode[] = []
	for (const n of nodes) {
		switch (n.type) {
			case "text": {
				const t = (n as MdText).value
				if (t) out.push({ type: "text", text: t, marks: active.length ? [...active] : undefined })
				break
			}
			case "emphasis":
				out.push(...flattenInline((n as any).children || [], addMark(active, { type: "italic" })))
				break
			case "strong":
				out.push(...flattenInline((n as any).children || [], addMark(active, { type: "bold" })))
				break
			case "delete":
				out.push(...flattenInline((n as any).children || [], addMark(active, { type: "strike" })))
				break
			case "inlineCode":
				out.push({
					type: "text",
					text: (n as any).value || "",
					marks: addMark(active, { type: "code" }),
				})
				break
			case "link": {
				const ln = n as any
				const href = ln.url || null
				const title = ln.title ?? null
				out.push(
					...flattenInline((ln.children || []) as any, addMark(active, { type: "link", attrs: { href, title } })),
				)
				break
			}
			case "break":
				out.push({ type: "hardBreak" })
				break
			default:
				// ignore unsupported inline nodes in this minimal pass
				break
		}
	}
	return out
}

function addMark(active: PMMark[], mark: PMMark): PMMark[] {
	if (active.find((m) => m.type === mark.type)) return active
	return [...active, mark]
}
