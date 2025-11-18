// @vitest-environment jsdom
import { expect, test } from "vitest"
import { Editor, type JSONContent } from "@tiptap/core"
import { MarkdownWc } from "./markdown-wc.js"
import { tiptapDocToAst, type PMNode } from "./tiptap-to-mdwc.js"
import type { Ast } from "../ast/schemas.js"

test("assign-data-id dedupes duplicate top-level ids on boot", () => {
	// Build a TipTap JSON doc with two paragraphs that share the same data.id
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { data: { id: "DUP" } },
				content: [{ type: "text", text: "A" }],
			},
			{
				type: "paragraph",
				attrs: { data: { id: "DUP" } },
				content: [{ type: "text", text: "B" }],
			},
		],
	}

	let i = 0
	const editor = new Editor({
		extensions: MarkdownWc({ idProvider: () => `FIX${i++}` }),
		content: doc,
	})

	// Trigger a benign edit to ensure appendTransaction runs and dedupes ids
	editor.commands.setTextSelection(editor.state.doc.content.size)
	editor.commands.insertContent(" ")

	const ast = tiptapDocToAst(editor.getJSON() as unknown as PMNode) as Ast
	const children = (ast as any).children ?? []
	const ids = children.map((n: any) => n?.data?.id)
	const texts = children.map((n: any) =>
		(n.children ?? [])
			.map((c: any) => c?.value ?? "")
			.join("")
			.trim()
	)

	// Expect two paragraphs with texts preserved
	expect(texts).toEqual(["A", "B"])
	// The first keeps DUP, the second gets a new id from idProvider
	expect(ids[0]).toBe("DUP")
	expect(typeof ids[1]).toBe("string")
	expect(ids[1]).toBe("FIX0")
	// Unique ids
	expect(new Set(ids).size).toBe(2)

	editor.destroy()
})

test("assign-data-id assigns ids to nested nodes", () => {
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }],
					},
					{
						type: "listItem",
						content: [{ type: "paragraph", content: [{ type: "text", text: "Item 2" }] }],
					},
				],
			},
		],
	}

	let nestedCounter = 0
	const editor = new Editor({
		extensions: MarkdownWc({ idProvider: () => `Nested_${nestedCounter++}` }),
		content: doc,
	})

	editor.commands.setTextSelection(editor.state.doc.content.size)
	editor.commands.insertContent(" ")

	const json = editor.getJSON() as JSONContent
	const list = json.content?.[0]
	const firstItem = list?.content?.[0]
	const firstParagraph = firstItem?.content?.[0]
	const secondItem = list?.content?.[1]
	const secondParagraph = secondItem?.content?.[0]

	const ids = [
		list?.attrs?.data?.id,
		firstItem?.attrs?.data?.id,
		firstParagraph?.attrs?.data?.id,
		secondItem?.attrs?.data?.id,
		secondParagraph?.attrs?.data?.id,
	].filter((id): id is string => typeof id === "string")

	expect(ids.length).toBe(5)
	expect(new Set(ids).size).toBe(ids.length)

	editor.destroy()
})

test("assign-data-id dedupes nested duplicate ids", () => {
	const doc: JSONContent = {
		type: "doc",
		content: [
			{
				type: "bulletList",
				attrs: { data: { id: "LIST_DUP" } },
				content: [
					{
						type: "listItem",
						attrs: { data: { id: "DUP" } },
						content: [
							{
								type: "paragraph",
								attrs: { data: { id: "P_DUP" } },
								content: [{ type: "text", text: "Item 1" }],
							},
						],
					},
					{
						type: "listItem",
						attrs: { data: { id: "DUP" } },
						content: [
							{
								type: "paragraph",
								attrs: { data: { id: "P_DUP" } },
								content: [{ type: "text", text: "Item 2" }],
							},
						],
					},
				],
			},
		],
	}

	let counter = 0
	const editor = new Editor({
		extensions: MarkdownWc({ idProvider: () => `FIX_DUP_${counter++}` }),
		content: doc,
	})

	editor.commands.setTextSelection(editor.state.doc.content.size)
	editor.commands.insertContent(" ")

	const json = editor.getJSON() as JSONContent
	const list = json.content?.[0]
	const firstItem = list?.content?.[0]
	const secondItem = list?.content?.[1]
	const firstParagraph = firstItem?.content?.[0]
	const secondParagraph = secondItem?.content?.[0]

	expect(list?.attrs?.data?.id).toBe("LIST_DUP")
	expect(firstItem?.attrs?.data?.id).toBe("DUP")
	expect(secondItem?.attrs?.data?.id).toBe("FIX_DUP_0")
	expect(firstParagraph?.attrs?.data?.id).toBe("P_DUP")
	expect(secondParagraph?.attrs?.data?.id).toBe("FIX_DUP_1")
	expect(new Set([firstItem?.attrs?.data?.id, secondItem?.attrs?.data?.id]).size).toBe(2)
	expect(new Set([firstParagraph?.attrs?.data?.id, secondParagraph?.attrs?.data?.id]).size).toBe(2)

	editor.destroy()
})
