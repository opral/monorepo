import { Node, Mark, type Extensions } from "@tiptap/core"

// Minimal schema-only nodes and marks for MarkdownWc
export function markdownWcNodes(): Extensions {
	return [
		// doc
		Node.create({ name: "doc", topNode: true, content: "block+" }),
		// text
		Node.create({ name: "text", group: "inline" }),
		// paragraph
		Node.create({
			name: "paragraph",
			group: "block",
			content: "inline*",
			addAttributes() {
				return { data: { default: null } }
			},
			renderHTML() {
				return ["p", 0]
			},
		}),
		// heading
		Node.create({
			name: "heading",
			group: "block",
			content: "inline*",
			addAttributes() {
				return { level: { default: 1 }, data: { default: null } }
			},
			renderHTML({ node }) {
				const level = (node as any).attrs?.level || 1
				return ["h" + level, 0]
			},
		}),
		// lists
		Node.create({
			name: "bulletList",
			group: "block",
			content: "listItem+",
			addAttributes() {
				return { isTaskList: { default: false }, data: { default: null } }
			},
			renderHTML() {
				// Match serializeToHtml default: plain <ul>
				return ["ul", 0]
			},
		}),
		Node.create({
			name: "orderedList",
			group: "block",
			content: "listItem+",
			addAttributes() {
				return { start: { default: 1 }, data: { default: null } }
			},
			renderHTML({ node }) {
				const attrs: any = {}
				const start = (node as any).attrs?.start
				if (start && start !== 1) attrs.start = start
				return ["ol", attrs, 0]
			},
		}),
		// table
		Node.create({
			name: "table",
			group: "block",
			content: "tableRow+",
			addAttributes() {
				return { align: { default: [] }, data: { default: null } }
			},
			renderHTML() {
				return ["table", ["tbody", 0]]
			},
		}),
		Node.create({
			name: "tableRow",
			content: "tableCell+",
			addAttributes() {
				return { data: { default: null } }
			},
			renderHTML() {
				return ["tr", 0]
			},
		}),
		Node.create({
			name: "tableCell",
			content: "inline*",
			addAttributes() {
				return { data: { default: null } }
			},
			renderHTML() {
				return ["td", 0]
			},
		}),
		Node.create({
			name: "listItem",
			group: "block",
			content: "paragraph block*",
			defining: true,
			addAttributes() {
				return { checked: { default: null }, data: { default: null } }
			},
			renderHTML() {
				// Match serializeToHtml default: plain <li>
				return ["li", 0]
			},
			addNodeView() {
				return ({ node, editor, getPos }) => {
					const dom = document.createElement("li")
					const isTask = node.attrs.checked === true || node.attrs.checked === false
					let input: HTMLInputElement | null = null
					const content = document.createElement("div")
					if (isTask) {
						dom.setAttribute("data-task", node.attrs.checked ? "x" : " ")
						input = document.createElement("input")
						input.type = "checkbox"
						input.checked = node.attrs.checked === true
						input.style.marginRight = "6px"
						input.addEventListener("mousedown", (e) => {
							// Prevent focusing the checkbox from moving the caret unexpectedly
							e.preventDefault()
						})
						input.addEventListener("change", () => {
							const pos = typeof getPos === "function" ? getPos() : null
							if (pos == null) return
							const tr = editor.view.state.tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								checked: !node.attrs.checked,
							})
							editor.view.dispatch(tr)
						})
						dom.appendChild(input)
					}
					dom.appendChild(content)
					return {
						dom,
						contentDOM: content,
						update: (newNode) => {
							if (newNode.type.name !== "listItem") return false
							const wasTask = isTask
							const isNowTask = newNode.attrs.checked === true || newNode.attrs.checked === false
							// If task-state toggled between task/non-task, recreate
							if (wasTask !== isNowTask) return false
							if (isNowTask) {
								if (input) input.checked = newNode.attrs.checked === true
								dom.setAttribute("data-task", newNode.attrs.checked ? "x" : " ")
							}
							// Update attrs reference
							// @ts-ignore - node is captured; we can't reassign but it's fine for event handlers
							node = newNode
							return true
						},
					}
				}
			},
		}),
		// blockquote
		Node.create({
			name: "blockquote",
			group: "block",
			content: "block+",
			defining: true,
			addAttributes() {
				return { data: { default: null } }
			},
			renderHTML() {
				return ["blockquote", 0]
			},
		}),
		// code block
		Node.create({
			name: "codeBlock",
			group: "block",
			content: "text*",
			marks: "",
			defining: true,
			code: true,
			addAttributes() {
				return { language: { default: null }, data: { default: null } }
			},
			renderHTML({ node }) {
				const lang = (node as any).attrs?.language ?? null
				const codeAttrs: any = {}
				if (lang) codeAttrs.class = `language-${lang}`
				return ["pre", ["code", codeAttrs, 0]]
			},
		}),
		// horizontal rule
		Node.create({
			name: "horizontalRule",
			group: "block",
			addAttributes() {
				return { data: { default: null } }
			},
			renderHTML() {
				return ["hr"]
			},
		}),
		// hard break
		Node.create({
			name: "hardBreak",
			group: "inline",
			inline: true,
			selectable: false,
			addAttributes() {
				return { data: { default: null } }
			},
			renderHTML() {
				return ["br"]
			},
		}),
		// marks
		Mark.create({
			name: "bold",
			renderHTML() {
				return ["strong", 0]
			},
		}),
		Mark.create({
			name: "italic",
			renderHTML() {
				return ["em", 0]
			},
		}),
		Mark.create({
			name: "strike",
			renderHTML() {
				return ["s", 0]
			},
		}),
		Mark.create({
			name: "code",
			renderHTML() {
				return ["code", 0]
			},
		}),
		Mark.create({
			name: "link",
			addAttributes() {
				return {
					href: { default: null },
					title: { default: null },
					data: { default: null },
				}
			},
			renderHTML({ mark }) {
				const attrs: any = {}
				const href = (mark as any).attrs?.href
				if (href) attrs.href = href
				const title = (mark as any).attrs?.title
				if (title) attrs.title = title
				return ["a", attrs, 0]
			},
		}),
		// image (inline)
		Node.create({
			name: "image",
			group: "inline",
			inline: true,
			atom: true,
			addAttributes() {
				return {
					src: { default: null },
					alt: { default: null },
					title: { default: null },
					data: { default: null },
				}
			},
			renderHTML({ node }) {
				const attrs: any = {}
				const src = (node as any).attrs?.src
				if (src) attrs.src = src
				const alt = (node as any).attrs?.alt
				if (alt) attrs.alt = alt
				const title = (node as any).attrs?.title
				if (title) attrs.title = title
				return ["img", attrs]
			},
		}),
	]
}
