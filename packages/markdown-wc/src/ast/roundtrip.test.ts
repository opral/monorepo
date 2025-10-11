import { describe, expect, test } from "vitest"
import type { MarkdownNode } from "./schemas.js"
import { parseMarkdown } from "./parse-markdown.js"
import { serializeAst } from "./serialize-ast.js"
import { validateAst } from "./validate-ast.js"

function expectNode<T extends MarkdownNode["type"]>(
	node: MarkdownNode | undefined,
	type: T
): Extract<MarkdownNode, { type: T }> {
	expect(node?.type).toBe(type)
	if (!node || node.type !== type) {
		throw new Error(`expected ${type} node`)
	}
	return node as Extract<MarkdownNode, { type: T }>
}

describe("root & paragraph", () => {
	test("paragraph text", () => {
		const input = `Hello world.`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const paragraph = expectNode(ast.children[0], "paragraph")
		const text = expectNode(paragraph.children?.[0], "text")
		expect(text.value).toBe("Hello world.")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("heading", () => {
	test.each([1, 2, 3, 4, 5, 6])("h%d exact roundtrip and depth", (level) => {
		const hashes = "#".repeat(level)
		const input = `${hashes} Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const heading = expectNode(ast.children[0], "heading")
		expect(heading.depth).toBe(level)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("inline marks", () => {
	test("strong", () => {
		const input = `**bold**`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const strong = expectNode(para.children?.[0], "strong")
		const text = expectNode(strong.children?.[0], "text")
		expect(text.value).toBe("bold")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("strong canonicalizes '__' to '**'", () => {
		const input = `__bold__`
		const canonicalOutput = `**bold**`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const strong = expectNode(para.children?.[0], "strong")
		const text = expectNode(strong.children?.[0], "text")
		expect(text.value).toBe("bold")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("italic (underscore canonical)", () => {
		const input = `_italic_`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const emphasis = expectNode(para.children?.[0], "emphasis")
		const text = expectNode(emphasis.children?.[0], "text")
		expect(text.value).toBe("italic")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("italic canonicalizes '*' to '_'", () => {
		const input = `*italic*`
		const canonicalOutput = `_italic_`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const emphasis = expectNode(para.children?.[0], "emphasis")
		const text = expectNode(emphasis.children?.[0], "text")
		expect(text.value).toBe("italic")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("inline code", () => {
		const input = "`code`"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const code = expectNode(para.children?.[0], "inlineCode")
		expect(code.value).toBe("code")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("strikethrough", () => {
		const input = `~~strike~~`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const strike = expectNode(para.children?.[0], "delete")
		const text = expectNode(strike.children?.[0], "text")
		expect(text.value).toBe("strike")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("code block", () => {
	test("fenced code with lang", () => {
		const input = "```js\nconst a = 1\n```"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const code = expectNode(ast.children[0], "code")
		expect(code.lang).toBe("js")
		expect(code.value).toBe("const a = 1")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("fenced code without lang", () => {
		const input = "```\nplain code\n```"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const code = expectNode(ast.children[0], "code")
		expect(code.lang).toBe(null)
		expect(code.value).toBe("plain code")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("lists", () => {
	test("unordered simple", () => {
		const input = `- one\n- two`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNode(ast.children[0], "list")
		expect(list.ordered).toBe(false)
		expect(list.children?.length).toBe(2)
		const firstItem = expectNode(list.children?.[0], "listItem")
		const firstPara = expectNode(firstItem.children?.[0], "paragraph")
		const firstText = expectNode(firstPara.children?.[0], "text")
		expect(firstText.value).toBe("one")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("unordered task list", () => {
		const input = `- [x] done\n- [ ] todo`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNode(ast.children[0], "list")
		expect(list.ordered).toBe(false)
		const items = list.children ?? []
		const firstItem = expectNode(items[0], "listItem")
		expect(firstItem.checked).toBe(true)
		const firstPara = expectNode(firstItem.children?.[0], "paragraph")
		const firstText = expectNode(firstPara.children?.[0], "text")
		expect(firstText.value).toBe("done")
		const secondItem = expectNode(items[1], "listItem")
		expect(secondItem.checked).toBe(false)
		const secondPara = expectNode(secondItem.children?.[0], "paragraph")
		const secondText = expectNode(secondPara.children?.[0], "text")
		expect(secondText.value).toBe("todo")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("ordered list", () => {
		const input = `1. one\n2. two`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNode(ast.children[0], "list")
		expect(list.ordered).toBe(true)
		expect(list.children?.length).toBe(2)
		const firstItem = expectNode(list.children?.[0], "listItem")
		const firstPara = expectNode(firstItem.children?.[0], "paragraph")
		const firstText = expectNode(firstPara.children?.[0], "text")
		expect(firstText.value).toBe("one")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("ordered list with start", () => {
		const input = `3. three\n4. four`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNode(ast.children[0], "list")
		expect(list.ordered).toBe(true)
		expect(list.start).toBe(3)
		expect(list.children?.length).toBe(2)
		const secondItem = expectNode(list.children?.[1], "listItem")
		const secondPara = expectNode(secondItem.children?.[0], "paragraph")
		const secondText = expectNode(secondPara.children?.[0], "text")
		expect(secondText.value).toBe("four")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("blockquote", () => {
	test("single paragraph", () => {
		const input = `> quote`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const bq = expectNode(ast.children[0], "blockquote")
		const para = expectNode(bq.children?.[0], "paragraph")
		const text = expectNode(para.children?.[0], "text")
		expect(text.value).toBe("quote")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("thematic break & break", () => {
	test("thematic break", () => {
		const input = `---`
		const canonicalOutput = `---`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		expect(ast.children[0]?.type).toBe("thematicBreak")
		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("hard line break (two spaces)", () => {
		const input = `line  \nbreak`
		const canonicalOutput = `line\\\nbreak`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		const hasBreak = (para?.children ?? []).some((c: { type?: string }) => c.type === "break")
		expect(hasBreak).toBe(true)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("hard line break (backslash at EOL)", () => {
		const input = `line\\\nbreak`
		const canonicalOutput = `line\\\nbreak`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		const hasBreak = (para?.children ?? []).some((c: { type?: string }) => c.type === "break")
		expect(hasBreak).toBe(true)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})

describe("html", () => {
	test("inline html exact roundtrip", () => {
		const input = `Hello <span class="x">world</span>.`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const children = para.children ?? []
		const t1 = expectNode(children[0], "text")
		expect(t1.value).toBe("Hello ")
		const htmlOpen = expectNode(children[1], "html")
		expect(htmlOpen.value).toBe('<span class="x">')
		const tWorld = expectNode(children[2], "text")
		expect(tWorld.value).toBe("world")
		const htmlClose = expectNode(children[3], "html")
		expect(htmlClose.value).toBe("</span>")
		const t2 = expectNode(children[4], "text")
		expect(t2.value).toBe(".")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("block html exact roundtrip", () => {
		const input = `<div class="wrap">\n<p>hello</p>\n</div>`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const html = expectNode(ast.children[0], "html")
		expect(html.value).toBe('<div class="wrap">\n<p>hello</p>\n</div>')

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("custom element with explicit open/close is allowed (inline html)", () => {
		const input = `<doc-figure src="/img.png"></doc-figure>`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		// Unknown/custom tags are treated as inline HTML inside a paragraph by remark-parse
		const para = expectNode(ast.children[0], "paragraph")
		const first = expectNode(para.children?.[0], "html")
		expect(first.value).toContain("doc-figure")

		expect(out).toBe(input)
	})

	test("self-closing custom element is forbidden", () => {
		const input = `<doc-figure src="/img.png" />`
		expect(() => parseMarkdown(input)).toThrow(/self-closing HTML tags/i)
	})
})

describe("image & link", () => {
	test("image with alt and title (exact roundtrip)", () => {
		const input = `![alt](https://example.com/a.png "title")`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const img = expectNode(para.children?.[0], "image")
		expect(img.url).toBe("https://example.com/a.png")
		expect(img.alt).toBe("alt")
		expect(img.title).toBe("title")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("link with text and title (exact roundtrip)", () => {
		const input = `[text](https://example.com "title")`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNode(ast.children[0], "paragraph")
		const link = expectNode(para.children?.[0], "link")
		expect(link.url).toBe("https://example.com")
		expect(link.title).toBe("title")
		const txt = expectNode(link.children?.[0], "text")
		expect(txt.value).toBe("text")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("table", () => {
	test("gfm table exact roundtrip", () => {
		const input = `| a | b |\n| - | - |\n| 1 | 2 |`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const table = expectNode(ast.children[0], "table")
		expect(Array.isArray(table.align)).toBe(true)
		const align = table.align
		expect(Array.isArray(align) ? align.length : 0).toBe(2)

		const rows = table.children ?? []
		const row1 = expectNode(rows[0], "tableRow")
		const row2 = expectNode(rows[1], "tableRow")
		const row1Cell1 = expectNode(row1.children?.[0], "tableCell")
		const row1Cell1Text = expectNode(row1Cell1.children?.[0], "text")
		expect(row1Cell1Text.value).toBe("a")
		const row1Cell2 = expectNode(row1.children?.[1], "tableCell")
		const row1Cell2Text = expectNode(row1Cell2.children?.[0], "text")
		expect(row1Cell2Text.value).toBe("b")
		const row2Cell1 = expectNode(row2.children?.[0], "tableCell")
		const row2Cell1Text = expectNode(row2Cell1.children?.[0], "text")
		expect(row2Cell1Text.value).toBe("1")
		const row2Cell2 = expectNode(row2.children?.[1], "tableCell")
		const row2Cell2Text = expectNode(row2Cell2.children?.[0], "text")
		expect(row2Cell2Text.value).toBe("2")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("gfm table canonicalizes compact pipes to spaced", () => {
		const input = `|a|b|\n|-|-|\n|1|2|`
		const canonicalOutput = `| a | b |\n| - | - |\n| 1 | 2 |`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const table = expectNode(ast.children[0], "table")
		expect(table.children?.length).toBe(2)
		const headerRow = expectNode(table.children?.[0], "tableRow")
		const headerCell1 = expectNode(headerRow.children?.[0], "tableCell")
		const headerCell1Text = expectNode(headerCell1.children?.[0], "text")
		expect(headerCell1Text.value).toBe("a")
		const headerCell2 = expectNode(headerRow.children?.[1], "tableCell")
		const headerCell2Text = expectNode(headerCell2.children?.[0], "text")
		expect(headerCell2Text.value).toBe("b")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})

describe("frontmatter (yaml)", () => {
	test("yaml exact roundtrip with heading", () => {
		const input = `---\ntitle: test\n---\n\n# Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const yaml = expectNode(ast.children[0], "yaml")
		expect(yaml.value).toBe("title: test")
		const heading = expectNode(ast.children[1], "heading")
		expect(heading.depth).toBe(1)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("canonicalizes missing blank line after yaml", () => {
		const input = `---\ntitle: test\n---\n# Heading`
		const canonicalOutput = `---\ntitle: test\n---\n\n# Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const yaml = expectNode(ast.children[0], "yaml")
		expect(yaml.value).toBe("title: test")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})
