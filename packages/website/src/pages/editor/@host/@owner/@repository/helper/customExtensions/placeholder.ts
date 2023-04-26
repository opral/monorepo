import Bold from "@tiptap/extension-bold"

export interface PlaceholderNodeOptions {
	HTMLAttributes: Record<string, any>
}

const PlaceholderNode = Bold.extend<PlaceholderNodeOptions>({
	name: "placeholderMark",

	renderHTML() {
		return ["span", this.options.HTMLAttributes, 0]
	},

	addKeyboardShortcuts() {
		return {}
	},
})

export default PlaceholderNode
