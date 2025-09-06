// Avoid tight compile-time coupling to mdast types; operate on structural shape

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

export function astToTiptapDoc(ast: any): PMNode {
	return { type: "doc", content: ast.children.map(astBlockToPM) }
}

function astBlockToPM(node: any): PMNode {
	switch (node.type) {
		case "paragraph":
			return {
				type: "paragraph",
				attrs: { data: (node as any).data ?? null },
				content: flattenInline((node as any).children || [], []),
			}
		case "heading":
			return {
				type: "heading",
				attrs: { level: (node as any).depth, data: (node as any).data ?? null },
				content: flattenInline((node as any).children || [], []),
			}
		case "list": {
			const n = node as any
			const type = n.ordered ? "orderedList" : "bulletList"
			let attrs: any = { data: n.data ?? null }
			if (n.ordered && n.start != null && n.start !== 1) attrs = { ...attrs, start: n.start }

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
			const attrs = { data: n.data ?? null, ...(hasChecked ? { checked: n.checked } : {}) }
			return { type: "listItem", attrs, content: (n.children || []).map(astBlockToPM) }
		}
		case "blockquote": {
			const n = node as any
			return {
				type: "blockquote",
				attrs: { data: n.data ?? null },
				content: (n.children || []).map(astBlockToPM),
			}
		}
		case "code": {
			const n = node as any
			return {
				type: "codeBlock",
				attrs: { language: n.lang ?? null, data: n.data ?? null },
				content: textContent(n.value || ""),
			}
		}
		case "thematicBreak":
			return { type: "horizontalRule", attrs: { data: (node as any).data ?? null } }
		case "table": {
			const n = node as any
			return {
				type: "table",
				attrs: { align: Array.isArray(n.align) ? n.align : [], data: n.data ?? null },
				content: (n.children || []).map(astBlockToPM),
			}
		}
		case "tableRow": {
			const n = node as any
			return {
				type: "tableRow",
				attrs: { data: n.data ?? null },
				content: (n.children || []).map(astBlockToPM),
			}
		}
		case "tableCell": {
			const n = node as any
			return {
				type: "tableCell",
				attrs: { data: n.data ?? null },
				content: flattenInline((n.children || []) as any, []),
			}
		}
		case "yaml":
			// Not represented in editor surface; drop
			return {
				type: "paragraph",
				attrs: { data: (node as any).data ?? null },
				content: textContent(""),
			}
		default:
			// Fallback: paragraph of inline content if present
			// @ts-ignore
			if ((node as any).children)
				return {
					type: "paragraph",
					attrs: { data: (node as any).data ?? null },
					content: flattenInline((node as any).children, []),
				}
			return {
				type: "paragraph",
				attrs: { data: (node as any).data ?? null },
				content: textContent(""),
			}
	}
}

function textContent(str: string): PMNode[] {
	return str ? [{ type: "text", text: str }] : []
}

function flattenInline(nodes: any[], active: PMMark[]): PMNode[] {
	const out: PMNode[] = []
	for (const n of nodes) {
		switch (n.type) {
			case "text": {
				const t = (n as any).value
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
					...flattenInline(
						(ln.children || []) as any,
						addMark(active, { type: "link", attrs: { href, title, data: ln.data ?? null } })
					)
				)
				break
			}
			case "image": {
				const im = n as any
				const src = im.url || null
				const title = im.title ?? null
				const alt = im.alt ?? null
				out.push({ type: "image", attrs: { src, title, alt, data: im.data ?? null } } as any)
				break
			}
			case "break":
				out.push({ type: "hardBreak", attrs: { data: (n as any).data ?? null } as any })
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
