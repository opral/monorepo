import Mention from "@tiptap/extension-mention"
//@ts-ignore
import type { Node, Editor, Range, State } from "@tiptap/core"

export interface PlaceholderNodeOptions {
	HTMLAttributes: Record<string, any>
}

const PlaceholderNode = Mention.extend<PlaceholderNodeOptions>({
	name: "placeholderNode",

	addOptions() {
		return {
			HTMLAttributes: {},
			renderLabel({ node }: { node: Node }) {
				return `${node.attrs.label ?? node.attrs.id}`
			},
			suggestion: {
				command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
					// increase range.to by one when the next node is of type "text"
					// and starts with a space character
					const nodeAfter = editor.view.state.selection.$to.nodeAfter
					const overrideSpace = nodeAfter?.text?.startsWith(" ")

					if (overrideSpace) {
						range.to += 1
					}

					editor
						.chain()
						.focus()
						.insertContentAt(range, [
							{
								type: this.name,
								attrs: props,
							},
							{
								type: "text",
								text: " ",
							},
						])
						.run()

					window.getSelection()?.collapseToEnd()
				},
				allow: ({ state, range }: { state: State; range: Range }) => {
					const $from = state.doc.resolve(range.from)
					const type = state.schema.nodes[this.name]
					const allow = !!$from.parent.type.contentMatch.matchType(type)

					return allow
				},
			},
		}
	},
})

export default PlaceholderNode
