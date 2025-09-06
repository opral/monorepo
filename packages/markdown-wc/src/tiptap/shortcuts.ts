import { Extension, InputRule, textblockTypeInputRule, wrappingInputRule } from "@tiptap/core"

// Markdown-like typing shortcuts and editor keybindings
// - "# ": Convert to heading (level by number of #)
// - "- ", "* ": Start bullet list
// - "1. ": Start ordered list (captures start)
// - "> ": Start blockquote
// - Mod-b / Mod-i / Shift-Mod-s: Toggle bold/italic/strike
export const MarkdownWcShortcuts = Extension.create({
	name: "markdownWcShortcuts",

	addInputRules() {
		const rules: any[] = []
		const { schema } = this.editor

		// Heading: #, ##, ..., ###### + space
		if ((schema.nodes as any).heading) {
			rules.push(
				textblockTypeInputRule({
					find: /^(#{1,6})\s$/,
					type: (schema.nodes as any).heading,
					getAttributes: (match) => ({ level: match[1]?.length || 1 }),
				})
			)
		}

		// Bullet list: - or * + space
		if ((schema.nodes as any).bulletList && (schema.nodes as any).listItem) {
			const bullet = (char: string) =>
				wrappingInputRule({
					find: new RegExp(`^\\${char}\\s$`),
					type: (schema.nodes as any).bulletList,
				})
			rules.push(bullet("-"))
			rules.push(bullet("*"))
		}

		// Ordered list: 1. + space (captures custom start)
		if ((schema.nodes as any).orderedList && (schema.nodes as any).listItem) {
			rules.push(
				wrappingInputRule({
					find: /^(\d+)\.\s$/,
					type: (schema.nodes as any).orderedList,
					getAttributes: (match) => ({ start: Number(match[1] || 1) }),
				})
			)
		}

		// Blockquote: > + space
		if ((schema.nodes as any).blockquote) {
			rules.push(
				wrappingInputRule({
					find: /^>\s$/,
					type: (schema.nodes as any).blockquote,
				})
			)
		}

		// Task list / TODOs: Notion-style only → "[] ", "[ ] ", "[x] "
		if ((schema.nodes as any).bulletList && (schema.nodes as any).listItem) {
			const patterns = [/^\[\]\s$/, /^\[ \]\s$/, /^\[(x|X)\]\s$/]
			for (const re of patterns) {
				rules.push(
					new InputRule({
						find: re as any,
						// @ts-expect-error - typing are outdated
						handler: ({ state, range, match, commands }) => {
							const checked = /x/i.test(String((match && match[1]) || ""))
							const $from: any = (state as any).selection.$from
							// Check if we're inside an existing bullet list
							for (let d = $from.depth; d > 0; d--) {
								const n = $from.node(d)
								if (n?.type?.name === "bulletList") {
									// Delete the typed trigger right before the cursor
									const len = match && (match as any)[0] ? (match as any)[0].length : 0
									if (len > 0) {
										commands.command(({ state, tr, dispatch }: any) => {
											const end = state.selection.from
											const start = Math.max(0, end - len)
											if (dispatch) dispatch(tr.delete(start, end))
											return true
										})
									}
									commands.updateAttributes("listItem", { checked })
									return null
								}
							}

							// Not in a list: delete trigger and replace the nearest paragraph
							// with bulletList > listItem(checked) > paragraph (preserving content after deletion)
							return commands.command(({ state, tr, dispatch }: any) => {
								// 1) Delete the trigger text using the provided range
								tr.delete(range.from, range.to)
								// 2) Find the nearest paragraph around the current selection
								const $from = tr.selection.$from
								let paraDepth = -1
								for (let d = $from.depth; d > 0; d--) {
									const n = $from.node(d)
									if (n?.type?.name === "paragraph") {
										paraDepth = d
										break
									}
								}
								if (paraDepth < 0) return false
								const paraNode = $from.node(paraDepth)
								const fromPos = $from.before(paraDepth)
								const toPos = fromPos + paraNode.nodeSize
								// 3) Build new wrapper structure reusing paragraph content
								const nodes: any = (state.schema as any).nodes
								const newParagraph = nodes.paragraph.create(paraNode.attrs, paraNode.content)
								const listItem = nodes.listItem.create({ checked }, newParagraph)
								const bulletList = nodes.bulletList.create(null, listItem)
								tr.replaceWith(fromPos, toPos, bulletList)
								if (dispatch) dispatch(tr)
								return true
							})
						},
					})
				)
			}
		}

		return rules
	},

	addKeyboardShortcuts() {
		return {
			// Bold / Italic / Strike
			"Mod-b": () => this.editor.chain().focus().toggleMark("bold").run(),
			"Mod-i": () => this.editor.chain().focus().toggleMark("italic").run(),
			"Shift-Mod-s": () => this.editor.chain().focus().toggleMark("strike").run(),

			// Enter in list: create a new list item; for tasks, make it unchecked
			Enter: () => {
				const { state } = this.editor
				const $from: any = state.selection.$from
				// Find enclosing listItem
				let inListItem = false
				let isTask = false
				for (let d = $from.depth; d > 0; d--) {
					const n = $from.node(d)
					if (n?.type?.name === "listItem") {
						inListItem = true
						isTask = n.attrs?.checked === true || n.attrs?.checked === false
						break
					}
				}
				if (!inListItem) return false
				// If current paragraph is empty, exit the list (lift)
				const para: any = $from.parent
				const isEmptyPara =
					para?.type?.name === "paragraph" && (para.textContent || "").length === 0
				if (isEmptyPara) {
					return this.editor.chain().focus().liftListItem("listItem").run()
				}
				const chain = this.editor.chain().focus()
				if (isTask) {
					return chain.splitListItem("listItem", { checked: false }).run()
				}
				return chain.splitListItem("listItem").run()
			},
		}
	},
})
