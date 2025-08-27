// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import { Editor } from "@tiptap/core"
import type { Ast } from "../ast/schemas.js"
import { markdownWcExtensions } from "./markdown-wc.js"
import { astToTiptapDoc } from "./mdwc-to-tiptap.js"
import { tiptapDocToAst } from "./tiptap-to-mdwc.js"

function roundtripThroughEditor(ast: Ast): Ast {
	const pmDoc = astToTiptapDoc(ast)
	const editor = new Editor({
		extensions: markdownWcExtensions(),
		content: pmDoc as any,
	})
	const outJSON = editor.getJSON() as any
	return tiptapDocToAst(outJSON as any) as any
}

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
