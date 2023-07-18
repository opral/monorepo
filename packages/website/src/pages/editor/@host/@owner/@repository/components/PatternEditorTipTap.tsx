import type * as ast from "@inlang/core/ast"
import { createTiptapEditor, useEditorJSON } from "solid-tiptap"
//@ts-ignore
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import { createEffect } from "solid-js"
import type { BCP47LanguageTag } from "@inlang/core/languageTag"

export const TipTapEditor = (props: {
	sourceLanguageTag: BCP47LanguageTag
	languageTag: BCP47LanguageTag
	id: ast.Message["id"]["name"]
	referenceMessage?: ast.Message
	message: ast.Message | undefined
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
			console.log(json())
		}
	})

	return (
		<div>
			<div id={props.id + "-" + props.languageTag} ref={ref} />
		</div>
	)
}
