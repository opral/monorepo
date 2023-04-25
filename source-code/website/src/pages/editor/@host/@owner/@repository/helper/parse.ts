import type { Accessor } from "solid-js"
import { useEditorJSON } from "solid-tiptap"
import type { EditorRef } from "solid-tiptap"

// access tiptap json
export const getTextValue = (editor: Accessor<EditorRef>) => {
	if (editor()) {
		const json = useEditorJSON(() => editor())
		if (json()) {
			const data = json()
			return data.content
				.filter((p: any) => p.content)
				.map((p: any) => p.content)
				.flat()
				.map((p: any) => p.text)
				.join("\n")
		}
	}
}

export const setTextValue = (editor: Accessor<EditorRef>, updatedText: string) => {
	if (editor()) {
		editor().commands.setContent({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: updatedText,
						},
					],
				},
			],
		})
	}
}
