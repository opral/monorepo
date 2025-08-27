// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import { Editor } from "@tiptap/core"
import { parseMarkdown } from "../ast/parse-markdown.js"
import { serializeAst } from "../ast/serialize-ast.js"
import { markdownWcExtensions } from "./markdown-wc.js"
import { markdownWcAstToTiptap } from "./mdwc-to-tiptap.js"
import { tiptapDocToMarkdownWcAst } from "./tiptap-to-mdwc.js"

test("append paragraph at end", () => {
	const input = `# Header\n\nHello`
	const expectedOutput = `# Header\n\nHello\n\nNew Paragraph`

	// 1) markdown doc is loaded
	const ast = parseMarkdown(input)
	const content = markdownWcAstToTiptap(ast)
	const editor = new Editor({
		extensions: markdownWcExtensions(),
		content: content as any,
	})

	// 2) user adds a new paragraph at the end
	editor.commands.insertContentAt(editor.state.doc.content.size, {
		type: "paragraph",
		content: [{ type: "text", text: "New Paragraph" }],
	} as any)

	// 3) roundtrip back to Markdown and assert expected
	const outAst = tiptapDocToMarkdownWcAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})

test("insert text mid-paragraph", () => {
	const input = `Hello world.`
	const expectedOutput = `Hello dear world.`

	const ast = parseMarkdown(input)
	const editor = new Editor({
		extensions: markdownWcExtensions(),
		content: markdownWcAstToTiptap(ast) as any,
	})

	// compute absolute pos after "Hello "
	const posAfter = (() => {
		let result: number | null = null
		editor.state.doc.descendants((node, pos) => {
			if ((node as any).isTextblock) {
				const idx = (node as any).textContent.indexOf("Hello ")
				if (idx >= 0) {
					result = pos + 1 + idx + "Hello ".length
					return false
				}
			}
		})
		if (result == null) throw new Error("target not found")
		return result
	})()

	editor.commands.insertContentAt(posAfter, { type: "text", text: "dear " } as any)

	const outAst = tiptapDocToMarkdownWcAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})

test("insert hard break in paragraph (replace following space)", () => {
	const input = `line break`
	const expectedOutput = `line\\\nbreak`

	const ast = parseMarkdown(input)
	const editor = new Editor({
		extensions: markdownWcExtensions(),
		content: markdownWcAstToTiptap(ast) as any,
	})

	// Replace the whole paragraph with a version that includes a hard break between words
	const para = editor.state.doc.child(0)
	const paraFrom = 1
	const paraTo = paraFrom + (para as any).content.size
	editor.commands.insertContentAt(
		{ from: paraFrom, to: paraTo } as any,
		{
			type: "paragraph",
			content: [
				{ type: "text", text: "line" },
				{ type: "hardBreak" },
				{ type: "text", text: "break" },
			],
		} as any
	)

	const outAst = tiptapDocToMarkdownWcAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})

test("split paragraph into two (insert new paragraph in the middle)", () => {
	const input = `Hello world.`
	const expectedOutput = `Hello\n\nworld.`

	const ast = parseMarkdown(input)
	const editor = new Editor({
		extensions: markdownWcExtensions(),
		content: markdownWcAstToTiptap(ast) as any,
	})

	// First paragraph positions
	const para = editor.state.doc.child(0)
	const paraFrom = 1
	const paraTo = paraFrom + (para as any).content.size
	const idxHello = (para as any).textContent.indexOf("Hello")
	const posSplit = paraFrom + 1 + idxHello + "Hello".length

	// Replace the trailing text (after 'Hello') with a new paragraph containing 'world.'
	editor.commands.insertContentAt(
		{ from: posSplit, to: paraTo } as any,
		{ type: "paragraph", content: [{ type: "text", text: "world." }] } as any
	)

	const outAst = tiptapDocToMarkdownWcAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})
