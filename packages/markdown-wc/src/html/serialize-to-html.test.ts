import { test, expect } from "vitest"
import { serializeToHtml } from "./serialize-to-html.js"

test("serializeToHtml maps node.data.* to HTML data-* attributes", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "paragraph",
				data: { id: "P1", foo: "bar" },
				children: [{ type: "text", value: "Hello" }],
			},
		],
	}

	const html = await serializeToHtml(ast)
	expect(html).toContain('<p data-id="P1" data-foo="bar">')
	expect(html).toContain(">Hello</p>")
})

test("serializeToHtml with diffHints adds data-diff-mode=words to paragraphs", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "paragraph",
				data: { id: "P1" },
				children: [{ type: "text", value: "Hello" }],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).toContain('<p data-id="P1" data-diff-mode="words" data-diff-show-when-removed="">')
})

test("serializeToHtml with diffHints marks identified nodes to show when removed", async () => {
	// Rendering markdown diffs relies on showing removed blocks inline, so any node
	// with a stable id should opt in via data-diff-show-when-removed by default.
	const ast = {
		type: "root",
		children: [
			{
				type: "paragraph",
				data: { id: "P1" },
				children: [{ type: "text", value: "Hello" }],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).toContain('<p data-id="P1" data-diff-mode="words" data-diff-show-when-removed="">')
})

test.each([1, 2, 3, 4, 5, 6])(
	"serializeToHtml with diffHints adds data-diff-mode=words to heading depth %s",
	async (depth) => {
		const ast = {
			type: "root",
			children: [
				{
					type: "heading",
					depth,
					data: { id: `H${depth}` },
					children: [{ type: "text", value: "Release notes" }],
				},
			],
		}

		const html = await serializeToHtml(ast, { diffHints: true })
		expect(html).toContain(
			`<h${depth} data-id="H${depth}" data-diff-mode="words" data-diff-show-when-removed="">`
		)
	}
)

test("serializeToHtml with diffHints adds data-diff-mode=words to table cells", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "table",
				children: [
					{
						type: "tableRow",
						children: [
							{
								type: "tableCell",
								data: { id: "header-1" },
								children: [{ type: "text", value: "Hello" }],
							},
						],
					},
					{
						type: "tableRow",
						children: [
							{
								type: "tableCell",
								data: { id: "cell-1" },
								children: [{ type: "text", value: "World" }],
							},
						],
					},
				],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).toContain(
		'<td data-id="cell-1" data-diff-mode="words" data-diff-show-when-removed="">World</td>'
	)
})
