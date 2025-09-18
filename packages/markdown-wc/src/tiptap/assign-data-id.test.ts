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
