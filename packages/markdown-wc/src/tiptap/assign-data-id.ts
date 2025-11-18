import { Extension } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"

function defaultGenId() {
	// Simple, readable id good enough for tests/runtime without external deps
	return "id_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}

export type AssignDataIdOptions = { idProvider?: () => string }

export function createAssignDataIdExtension(opts?: AssignDataIdOptions) {
	const idProvider = opts?.idProvider ?? defaultGenId
	const supportsDataAttr = (node: any) =>
		Boolean(node?.type?.spec?.attrs && "data" in node.type.spec.attrs)
	const nextUniqueId = (seen: Set<string>) => {
		let next: string | null = null
		while (!next || seen.has(next)) {
			next = idProvider()
		}
		return next
	}
	return Extension.create({
		name: "markdownWcAssignDataId",
		addProseMirrorPlugins() {
			return [
				new Plugin({
					appendTransaction: (_trs: readonly any[], oldState: any, newState: any) => {
						if (oldState.doc === newState.doc) return null

						const tr = newState.tr
						let modified = false
						const seen = new Set<string>()

						newState.doc.descendants((node: any, pos: number) => {
							if (!supportsDataAttr(node)) return
							const attrs = node.attrs || {}
							const data = attrs.data || null
							let id: string | null =
								data && typeof data.id === "string" && data.id.length > 0
									? (data.id as string)
									: null
							if (id && seen.has(id)) id = null
							if (!id) {
								id = nextUniqueId(seen)
								const nextData = { ...(data || {}), id }
								const nextAttrs = { ...attrs, data: nextData }
								tr.setNodeMarkup(pos, undefined, nextAttrs, node.marks)
								modified = true
							}
							seen.add(id!)
						})

						return modified ? tr : null
					},
				}),
			]
		},
	})
}
