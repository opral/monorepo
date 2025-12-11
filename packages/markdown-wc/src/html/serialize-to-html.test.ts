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
	expect(html).toContain('<p data-diff-key="P1" data-foo="bar">')
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
	expect(html).toContain(
		'<p data-diff-key="P1" data-diff-mode="words" data-diff-show-when-removed="">'
	)
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
	expect(html).toContain(
		'<p data-diff-key="P1" data-diff-mode="words" data-diff-show-when-removed="">'
	)
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
			`<h${depth} data-diff-key="H${depth}" data-diff-mode="words" data-diff-show-when-removed="">`
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
		'<td data-diff-key="cell-1" data-diff-mode="words" data-diff-show-when-removed="">World</td>'
	)
})

test("serializeToHtml with diffHints assigns ids to table wrappers", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "table",
				data: { id: "table-1" },
				children: [
					{
						type: "tableRow",
						children: [
							{
								type: "tableCell",
								data: { id: "header-1" },
								children: [{ type: "text", value: "Column 1" }],
							},
						],
					},
					{
						type: "tableRow",
						children: [
							{
								type: "tableCell",
								data: { id: "cell-1" },
								children: [{ type: "text", value: "Value" }],
							},
						],
					},
				],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).toContain('<thead data-diff-key="table-1_thead" data-diff-show-when-removed="">')
	expect(html).toContain('<tbody data-diff-key="table-1_tbody" data-diff-show-when-removed="">')
})

test("serializeToHtml with diffHints treats list items as atomic elements", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "list",
				ordered: false,
				children: [
					{
						type: "listItem",
						data: { id: "item-1" },
						children: [
							{
								type: "paragraph",
								data: { id: "para-1" },
								children: [{ type: "text", value: "First task" }],
							},
						],
					},
				],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).toContain(
		'<li data-diff-key="item-1" data-diff-mode="element" data-diff-show-when-removed="">'
	)
	expect(html).toContain('<p data-diff-key="para-1" data-diff-show-when-removed="">First task</p>')
	expect(html).not.toMatch(/<p[^>]*data-diff-key="para-1"[^>]*data-diff-mode=/)
})

test("serializeToHtml with diffHints leaves task list checkboxes without diff ids", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "list",
				ordered: false,
				data: { id: "list-1" },
				children: [
					{
						type: "listItem",
						data: { id: "item-1" },
						checked: true,
						children: [
							{
								type: "paragraph",
								data: { id: "para-1" },
								children: [{ type: "text", value: "checkbox" }],
							},
						],
					},
				],
			},
		],
	}

	const html = await serializeToHtml(ast, { diffHints: true })
	expect(html).not.toMatch(/data-diff-key="item-1_checkbox"/)
	expect(html).not.toMatch(/item-1_checkbox[^>]*data-diff-show-when-removed=/)
})

test("serializeToHtml externalLinks option annotates external links", async () => {
	const ast = {
		type: "root",
		children: [
			{
				type: "paragraph",
				children: [
					{
						type: "link",
						url: "/docs/hello",
						children: [{ type: "text", value: "internal" }],
					},
					{ type: "text", value: " " },
					{
						type: "link",
						url: "https://example.com",
						children: [{ type: "text", value: "external" }],
					},
				],
			},
		],
	}

	const html = await serializeToHtml(ast, { externalLinks: true })
	expect(html).toContain('href="/docs/hello"')
	expect(html).toContain('href="https://example.com"')
	expect(html).toContain('target="_blank"')
	expect(html).toContain('rel="noopener noreferrer"')
})
