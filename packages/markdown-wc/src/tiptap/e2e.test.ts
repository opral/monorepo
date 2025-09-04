// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import { Editor } from "@tiptap/core"
import { parseMarkdown } from "../ast/parse-markdown.js"
import { serializeAst } from "../ast/serialize-ast.js"
import { MarkdownWc } from "./markdown-wc.js"
import { astToTiptapDoc } from "./mdwc-to-tiptap.js"
import { tiptapDocToAst } from "./tiptap-to-mdwc.js"
import type { Ast } from "../ast/schemas.js"

function roundtripThroughEditor(ast: Ast): Ast {
	const pmDoc = astToTiptapDoc(ast)
	const editor = new Editor({
		extensions: MarkdownWc(),
		content: pmDoc as any,
	})
	const outJSON = editor.getJSON() as any
	return tiptapDocToAst(outJSON as any) as any
}

test("append paragraph at end", () => {
	const input = `# Header\n\nHello`
	const expectedOutput = `# Header\n\nHello\n\nNew Paragraph`

	// 1) markdown doc is loaded
	const ast = parseMarkdown(input)
	const content = astToTiptapDoc(ast)
	const editor = new Editor({
		extensions: MarkdownWc(),
		content: content as any,
	})

	// 2) user adds a new paragraph at the end
	editor.commands.insertContentAt(editor.state.doc.content.size, {
		type: "paragraph",
		content: [{ type: "text", text: "New Paragraph" }],
	} as any)

	// 3) roundtrip back to Markdown and assert expected
	const outAst = tiptapDocToAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})

describe("Editor roundtrip (AST → TipTap Editor → AST)", () => {
	test("heading + paragraph", () => {
		const input: Ast = {
			type: "root",
			children: [
				{ type: "heading", depth: 1, children: [{ type: "text", value: "Heading" }] },
				{ type: "paragraph", children: [{ type: "text", value: "Hello world." }] },
			],
		} as any
		const output = roundtripThroughEditor(input)
		expect(output).toEqual(input)
	})

	test("unordered list", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "list",
					ordered: false,
					children: [
						{
							type: "listItem",
							children: [{ type: "paragraph", children: [{ type: "text", value: "one" }] }],
						},
						{
							type: "listItem",
							children: [{ type: "paragraph", children: [{ type: "text", value: "two" }] }],
						},
					],
				},
			],
		} as any
		const output = roundtripThroughEditor(input)
		expect(output).toEqual(input)
	})

	test("ordered list with start", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "list",
					ordered: true,
					start: 3,
					children: [
						{
							type: "listItem",
							children: [{ type: "paragraph", children: [{ type: "text", value: "three" }] }],
						},
						{
							type: "listItem",
							children: [{ type: "paragraph", children: [{ type: "text", value: "four" }] }],
						},
					],
				},
			],
		} as any
		const output = roundtripThroughEditor(input)
		expect(output).toEqual(input)
	})

	test("marks (bold + italic + inlineCode + strike)", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [
						{ type: "strong", children: [{ type: "text", value: "bold" }] },
						{ type: "text", value: " " },
						{ type: "emphasis", children: [{ type: "text", value: "italic" }] },
						{ type: "text", value: " " },
						{ type: "inlineCode", value: "code" } as any,
						{ type: "text", value: " " },
						{ type: "delete", children: [{ type: "text", value: "strike" }] },
					],
				},
			],
		} as any
		const output = roundtripThroughEditor(input)
		expect(output).toEqual(input)
	})

	test("blockquote + thematicBreak + code block", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "blockquote",
					children: [{ type: "paragraph", children: [{ type: "text", value: "quote" }] }],
				},
				{ type: "thematicBreak" },
				{ type: "code", lang: "js", value: "const a = 1" },
			],
		} as any
		const output = roundtripThroughEditor(input)
		expect(output).toEqual(input)
	})

	test("hard break", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "line" },
						{ type: "break" } as any,
						{ type: "text", value: "break" },
					],
				},
			],
		} as any
		const output = roundtripThroughEditor(input)
		expect(output).toEqual(input)
	})
})

describe("IDs: preserve existing and create for new blocks", () => {
	test("no-op editor roundtrip preserves existing data.id on blocks", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "heading",
					depth: 1,
					data: { id: "H1" },
					children: [{ type: "text", value: "Heading" }],
				} as any,
				{
					type: "paragraph",
					data: { id: "P1" },
					children: [{ type: "text", value: "Hello world." }],
				} as any,
			],
		} as any

		const editor = new Editor({
			extensions: MarkdownWc(),
			content: astToTiptapDoc(input) as any,
		})

		const outAst = tiptapDocToAst(editor.getJSON() as any) as any
		const ids = (outAst.children || []).map((n: any) => n?.data?.id)

		expect(ids).toEqual(["H1", "P1"]) // should preserve exactly
	})

	test("splitting a paragraph creates a new data.id for the new block", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "paragraph",
					data: { id: "PX" },
					children: [{ type: "text", value: "Hello world." }],
				} as any,
			],
		} as any

		const editor = new Editor({
			extensions: MarkdownWc(),
			content: astToTiptapDoc(input) as any,
		})

		// Compute split position after "Hello"
		const para = editor.state.doc.child(0)
		const paraFrom = 1
		const idxHello = (para as any).textContent.indexOf("Hello")
		const posSplit = paraFrom + 1 + idxHello + "Hello".length

		// Replace trailing text with a new paragraph to simulate a split
		const paraTo = paraFrom + (para as any).content.size
		editor.commands.insertContentAt(
			{ from: posSplit, to: paraTo } as any,
			{ type: "paragraph", content: [{ type: "text", text: " world." }] } as any
		)

		const outAst = tiptapDocToAst(editor.getJSON() as any) as any
		const ids = (outAst.children || []).map((n: any) => n?.data?.id)

		expect(ids[0]).toBe("PX") // original keeps id
		expect(typeof ids[1]).toBe("string")
		expect(ids[1]).toBeTruthy()
		expect(ids[1]).not.toBe(ids[0]) // new block gets a fresh id
	})

	test("appending a new paragraph assigns a fresh data.id", () => {
		const input: Ast = {
			type: "root",
			children: [
				{
					type: "paragraph",
					data: { id: "P1" },
					children: [{ type: "text", value: "Hello" }],
				} as any,
			],
		} as any

		const editor = new Editor({
			extensions: MarkdownWc(),
			content: astToTiptapDoc(input) as any,
		})

		editor.commands.insertContentAt(editor.state.doc.content.size, {
			type: "paragraph",
			content: [{ type: "text", text: "New" }],
		} as any)

		const outAst = tiptapDocToAst(editor.getJSON() as any) as any
		const ids = (outAst.children || []).map((n: any) => n?.data?.id)

		expect(ids[0]).toBe("P1")
		expect(typeof ids[1]).toBe("string")
		expect(ids[1]).toBeTruthy()
		expect(ids[1]).not.toBe("P1")
	})
})

test("insert text mid-paragraph", () => {
	const input = `Hello world.`
	const expectedOutput = `Hello dear world.`

	const ast = parseMarkdown(input)
	const editor = new Editor({
		extensions: MarkdownWc(),
		content: astToTiptapDoc(ast) as any,
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
			return
		})
		if (result == null) throw new Error("target not found")
		return result
	})()

	editor.commands.insertContentAt(posAfter, { type: "text", text: "dear " } as any)

	const outAst = tiptapDocToAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})

test("insert hard break in paragraph (replace following space)", () => {
	const input = `line break`
	const expectedOutput = `line\\\nbreak`

	const ast = parseMarkdown(input)
	const editor = new Editor({
		extensions: MarkdownWc(),
		content: astToTiptapDoc(ast) as any,
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

	const outAst = tiptapDocToAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})

test("split paragraph into two (insert new paragraph in the middle)", () => {
	const input = `Hello world.`
	const expectedOutput = `Hello\n\nworld.`

	const ast = parseMarkdown(input)
	const editor = new Editor({
		extensions: MarkdownWc(),
		content: astToTiptapDoc(ast) as any,
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

	const outAst = tiptapDocToAst(editor.getJSON() as any)
	const output = serializeAst(outAst as any)
	expect(output).toBe(expectedOutput)
})
