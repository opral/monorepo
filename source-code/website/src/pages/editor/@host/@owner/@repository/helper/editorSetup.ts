import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import Placeholder from "@tiptap/extension-placeholder"
import History from "@tiptap/extension-history"
import HardBreak from "@tiptap/extension-hard-break"
import FloatingMenu from "@tiptap/extension-floating-menu"
import { setTipTapMessage } from "./parse.js"
import type * as ast from "@inlang/core/ast"
import PlaceholderNode from "./customExtensions/placeholder.js"

export const getEditorConfig = (ref: HTMLDivElement, message: ast.Message | undefined) => {
	return {
		element: ref!,
		extensions: [
			PlaceholderNode.configure({
				HTMLAttributes: {
					class:
						"bg-surface-2 py-[2px] px-1 rounded-sm text-info text-sm ponter-events-none italic",
				},
			}),
			HardBreak.extend({
				addKeyboardShortcuts() {
					return {
						Enter: () => this.editor.commands.setHardBreak(),
					}
				},
			}),
			Document,
			Paragraph,
			Text,
			Placeholder.configure({
				emptyEditorClass: "is-editor-empty",
				placeholder: "Enter translation...",
			}),
			History.configure({
				depth: 10,
			}),
			FloatingMenu.configure({
				element: document.querySelector(".test"),
				//@ts-ignore
				shouldShow: ({ editor }) => {
					// show the floating within any paragraph
					return editor.isActive("paragraph")
				},
				tippyOptions: {
					duration: 200,
				},
			}),
		],
		editorProps: {
			attributes: {
				class: "focus:outline-none",
				spellcheck: false,
			},
		},
		content:
			message && (message.pattern.elements[0] as ast.Text | undefined)?.value
				? setTipTapMessage(message)
				: undefined,
	}
}
