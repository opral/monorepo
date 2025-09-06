import { Extension } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"

function defaultGenId() {
	// Simple, readable id good enough for tests/runtime without external deps
	return "id_" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}

export type AssignDataIdOptions = { idProvider?: () => string }

export function createAssignDataIdExtension(opts?: AssignDataIdOptions) {
	const idProvider = opts?.idProvider ?? defaultGenId
	return Extension.create({
		name: "markdownWcAssignDataId",
		addProseMirrorPlugins() {
			return [
				new Plugin({
					appendTransaction: (_trs: readonly any[], oldState: any, newState: any) => {
						if (oldState.doc === newState.doc) return null

						const tr = newState.tr
						let modified = false

						// Iterate top-level children and ensure data.id
						const doc = newState.doc
						let pos = 0
						for (let i = 0; i < doc.childCount; i++) {
							const node = doc.child(i) as any
							const attrs = node.attrs || {}
							const data = attrs.data || null
							const hasId = data && typeof data.id === "string" && data.id.length > 0
							if (!hasId) {
								const nextData = { ...(data || {}), id: idProvider() }
								const nextAttrs = { ...attrs, data: nextData }
								tr.setNodeMarkup(pos, undefined, nextAttrs)
								modified = true
							}
							pos += node.nodeSize
						}

						return modified ? tr : null
					},
				}),
			]
		},
	})
}
