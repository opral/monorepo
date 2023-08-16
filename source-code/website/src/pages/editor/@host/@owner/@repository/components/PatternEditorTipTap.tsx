import { createTiptapEditor, useEditorJSON } from "solid-tiptap"
//@ts-ignore
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import { createEffect } from "solid-js"
import type { LanguageTag, Message } from "@inlang/app"

export const TipTapEditor = (props: {
	languageTag: LanguageTag
	id: Message["id"]
}) => {
	//editor
	let ref!: HTMLDivElement

	const editor = createTiptapEditor(() => ({
		element: ref!,
		extensions: [Document, Paragraph, Text],
		content: `<p>Example Text</p>`,
	}))

	createEffect(() => {
		if (editor) {
			const json = useEditorJSON(() => editor())
			console.debug(json())
		}
	})

	return (
		<div>
			<div id={props.id + "-" + props.languageTag} ref={ref} />
		</div>
	)
}
