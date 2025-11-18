// Avoid tight compile-time coupling to mdast types; operate on structural shape

const SPREAD_META_KEY = "__mdwc_spread"

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
			const paragraphData = buildNodeData((node as any).data)
			return {
				type: "paragraph",
				attrs: { data: paragraphData },
				content: flattenInline((node as any).children || [], []),
			}
		case "heading":
			const headingData = buildNodeData((node as any).data)
			return {
				type: "heading",
				attrs: { level: (node as any).depth, data: headingData },
				content: flattenInline((node as any).children || [], []),
			}
		case "list": {
			const n = node as any
			const type = n.ordered ? "orderedList" : "bulletList"
			let attrs: any = {
				data: buildNodeData(n.data, {
					[SPREAD_META_KEY]: typeof n.spread === "boolean" ? n.spread : undefined,
				}),
			}
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
			const attrs = {
				data: buildNodeData(n.data, {
					[SPREAD_META_KEY]: typeof n.spread === "boolean" ? n.spread : undefined,
				}),
				...(hasChecked ? { checked: n.checked } : {}),
			}
			return { type: "listItem", attrs, content: (n.children || []).map(astBlockToPM) }
		}
		case "blockquote": {
			const n = node as any
			return {
				type: "blockquote",
				attrs: { data: buildNodeData(n.data) },
				content: (n.children || []).map(astBlockToPM),
			}
		}
		case "code": {
			const n = node as any
			return {
				type: "codeBlock",
				attrs: { language: n.lang ?? null, data: buildNodeData(n.data) },
				content: textContent(n.value || ""),
			}
		}
		case "html": {
			const n = node as any
			return {
				type: "markdownUnsupported",
				attrs: {
					kind: "html",
					value: n.value ?? "",
					data: buildNodeData(n.data),
				},
			}
		}
		case "yaml": {
			const n = node as any
			return {
				type: "markdownUnsupported",
				attrs: {
					kind: "yaml",
					value: n.value ?? "",
					data: buildNodeData(n.data),
				},
			}
		}
		case "thematicBreak": {
			const hrData = buildNodeData((node as any).data)
			return { type: "horizontalRule", attrs: { data: hrData } }
		}
		case "table": {
			const n = node as any
			return {
				type: "table",
				attrs: { align: Array.isArray(n.align) ? n.align : [], data: buildNodeData(n.data) },
				content: (n.children || []).map(astBlockToPM),
			}
		}
		case "tableRow": {
			const n = node as any
			return {
				type: "tableRow",
				attrs: { data: buildNodeData(n.data) },
				content: (n.children || []).map(astBlockToPM),
			}
		}
		case "tableCell": {
			const n = node as any
			return {
				type: "tableCell",
				attrs: { data: buildNodeData(n.data) },
				content: flattenInline((n.children || []) as any, []),
			}
		}
		default:
			// Fallback: paragraph of inline content if present
			// @ts-ignore
			if ((node as any).children)
				return {
					type: "paragraph",
					attrs: { data: buildNodeData((node as any).data) },
					content: flattenInline((node as any).children, []),
				}
			return {
				type: "paragraph",
				attrs: { data: buildNodeData((node as any).data) },
				content: textContent(""),
			}
	}
}

function buildNodeData(
	data: Record<string, any> | null | undefined,
	extras?: Record<string, unknown>
): Record<string, any> | null {
	const base = data && typeof data === "object" ? { ...data } : {}
	if (extras) {
		for (const [key, value] of Object.entries(extras)) {
			if (value === undefined) continue
			base[key] = value
		}
	}
	return Object.keys(base).length > 0 ? base : null
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
			case "html": {
				const html = n as any
				out.push({
					type: "markdownInlineHtml",
					attrs: { value: html.value ?? "", data: html.data ?? null },
				})
				break
			}
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
