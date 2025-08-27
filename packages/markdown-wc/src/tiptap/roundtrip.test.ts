// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import type { Root } from "mdast"
import { astToTiptapDoc } from "./mdwc-to-tiptap.js"
import { tiptapDocToAst } from "./tiptap-to-mdwc.js"
import { Editor } from "@tiptap/core"
import { markdownWcExtensions } from "./markdown-wc.js"

function roundtrip(ast: Root): Root {
	const pmDoc = astToTiptapDoc(ast)
	const out = tiptapDocToAst(pmDoc as any)
	return out as any
}

function roundtripThroughEditor(ast: Root): Root {
	const pmDoc = astToTiptapDoc(ast)
	const editor = new Editor({
		extensions: markdownWcExtensions(),
		content: pmDoc as any,
	})
	const outJSON = editor.getJSON() as any
	return tiptapDocToAst(outJSON as any) as any
}

describe("root & paragraph", () => {
	test("simple paragraph", () => {
		const input: Root = {
			type: "root",
			children: [{ type: "paragraph", children: [{ type: "text", value: "Hello world." }] }],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})
})

describe("heading", () => {
	for (let level = 1 as 1 | 2 | 3 | 4 | 5 | 6; level <= 6; level++) {
		test(`h${level}`, () => {
			const input: Root = {
				type: "root",
				children: [
					{ type: "heading", depth: level, children: [{ type: "text", value: "Heading" }] },
				],
			} as any
			const output = roundtrip(input)
			expect(output).toEqual(input)
			const editorOutput = roundtripThroughEditor(input)
			expect(editorOutput).toEqual(input)
		})
	}
})

describe("paragraph marks", () => {
	test("bold + italic + text", () => {
		const input: Root = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [
						{ type: "text", value: "Hello " },
						{ type: "strong", children: [{ type: "text", value: "world" }] },
						{ type: "text", value: " and " },
						{ type: "emphasis", children: [{ type: "text", value: "friends" }] },
						{ type: "text", value: "." },
					],
				},
			],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})

	test("strong only", () => {
		const input: Root = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [{ type: "strong", children: [{ type: "text", value: "bold" }] }],
				},
			],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})

	test("italic only", () => {
		const input: Root = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [{ type: "emphasis", children: [{ type: "text", value: "italic" }] }],
				},
			],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})

	test("inline code", () => {
		const input: Root = {
			type: "root",
			children: [{ type: "paragraph", children: [{ type: "inlineCode", value: "code" } as any] }],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})

	test("strikethrough", () => {
		const input: Root = {
			type: "root",
			children: [
				{
					type: "paragraph",
					children: [{ type: "delete", children: [{ type: "text", value: "strike" }] }],
				},
			],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})
})

describe("lists", () => {
	test("unordered", () => {
		const input: Root = {
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
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})

	test("ordered (start omitted = 1)", () => {
		const input: Root = {
			type: "root",
			children: [
				{
					type: "list",
					ordered: true,
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
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})

	test("ordered with start=3", () => {
		const input: Root = {
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
		const output = roundtrip(input)
		expect(output).toEqual(input)
		const editorOutput = roundtripThroughEditor(input)
		expect(editorOutput).toEqual(input)
	})
})

describe("blocks", () => {
	test("blockquote", () => {
		const input: Root = {
			type: "root",
			children: [
				{
					type: "blockquote",
					children: [{ type: "paragraph", children: [{ type: "text", value: "quote" }] }],
				},
			],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
	})

	test("thematic break", () => {
		const input: Root = { type: "root", children: [{ type: "thematicBreak" }] } as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
	})

	test("code block", () => {
		const input: Root = {
			type: "root",
			children: [{ type: "code", lang: "js", value: "const a = 1" }],
		} as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
	})

	test("code block without lang", () => {
		const input: Root = { type: "root", children: [{ type: "code", value: "plain" }] } as any
		const output = roundtrip(input)
		expect(output).toEqual(input)
	})
})

describe("inline", () => {
	test("hard break", () => {
		const input: Root = {
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
		const output = roundtrip(input)
		expect(output).toEqual(input)
	})
})
