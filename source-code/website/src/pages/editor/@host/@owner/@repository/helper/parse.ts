import type { Accessor } from "solid-js"
import { useEditorJSON } from "solid-tiptap"
import type { EditorRef } from "solid-tiptap"
import type * as ast from "@inlang/core/ast"

// access tiptap json
export const getTextValue = (editor: Accessor<EditorRef>) => {
	if (editor()) {
		const json = useEditorJSON(() => editor())
		if (json()) {
			const data = json()
			const tiptap_nodes = data.content
				.filter((p: any) => p.content)
				.map((p: any) => p.content)
				.flat()

			const ast_elements: Array<any> = []
			tiptap_nodes.map((tiptap_node: any) => {
				switch (tiptap_node.type) {
					case "text":
						if (ast_elements.at(-1)?.type === "Text") {
							ast_elements.at(-1).value += tiptap_node.text
						} else {
							ast_elements.push({ type: "Text", value: tiptap_node.text } as ast.Text)
						}
						break
					case "placeholderNode":
						ast_elements.push({
							type: "Placeholder",
							body: { type: "VariableReference", name: tiptap_node.attrs.id },
						} as ast.Placeholder)
						break
					case "hardBreak":
						if (ast_elements.at(-1)?.type === "Text") {
							ast_elements.at(-1).value += "\n"
						} else {
							ast_elements.push({ type: "Text", value: "\n" } as ast.Text)
						}
						break
				}
			})
			return ast_elements
		}
	}
	return undefined
}

// setTipTapMessage

export const setTipTapMessage = (ast_message: ast.Message) => {
	// if no elements in ast message, don't put any nodes in tiptap object
	if (ast_message.pattern.elements.length === 0) return undefined

	const ast_elements = ast_message.pattern.elements
	const tiptap_nodes: any = []

	ast_elements.map((ast_element) => {
		switch (ast_element.type) {
			case "Text":
				if (ast_element.value !== "") {
					tiptap_nodes.push(getTextFromAstElement(ast_element))
				}
				break
			case "Placeholder":
				tiptap_nodes.push(getPlaceholderFromAstElement(ast_element))
				break
		}
	})

	const tiptapObject = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: tiptap_nodes,
			},
		],
	}
	return tiptapObject
}

// TEXT

const getTextFromAstElement = (ast_element: ast.Text) => {
	return {
		type: "text",
		text: (ast_element as ast.Text | undefined)?.value,
	}
}

// PLACEHOLDER

const getPlaceholderFromAstElement = (ast_element: ast.Placeholder) => {
	return {
		type: "placeholderNode",
		attrs: {
			id: (ast_element as ast.Placeholder | undefined)?.body.name,
			label: (ast_element as ast.Placeholder | undefined)?.body.name,
		},
	}
}
