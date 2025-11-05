import { describe, expect, test } from "vitest"
import { parseMarkdown } from "./parse-markdown.js"
import { serializeAst } from "./serialize-ast.js"
import { validateAst } from "./validate-ast.js"
import type { MarkdownNode } from "./schemas.js"

function expectNodeType<T extends MarkdownNode["type"]>(
	node: MarkdownNode | undefined,
	type: T,
): Extract<MarkdownNode, { type: T }> {
	expect(node?.type).toBe(type)
	if (!node || node.type !== type) {
		throw new Error(`Expected node of type '${type}', received '${node?.type ?? "undefined"}'.`)
	}
	return node as Extract<MarkdownNode, { type: T }>
}

function childAt<T extends MarkdownNode["type"]>(
	parent: { children?: MarkdownNode[] },
	index: number,
	type: T,
): Extract<MarkdownNode, { type: T }> {
	return expectNodeType(parent.children?.[index], type)
}

describe("root & paragraph", () => {
	test("paragraph text", () => {
		const input = `Hello world.`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const paragraph = expectNodeType(ast.children[0], "paragraph")
		const text = childAt(paragraph, 0, "text")
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

		const heading = expectNodeType(ast.children[0], "heading")
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

		const para = expectNodeType(ast.children[0], "paragraph")
		const strong = childAt(para, 0, "strong")
		const text = childAt(strong, 0, "text")
		expect(text.value).toBe("bold")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("strong canonicalizes '__' to '**'", () => {
		const input = `__bold__`
		const canonicalOutput = `**bold**`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const strong = childAt(para, 0, "strong")
		const text = childAt(strong, 0, "text")
		expect(text.value).toBe("bold")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("italic (underscore canonical)", () => {
		const input = `_italic_`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const emphasis = childAt(para, 0, "emphasis")
		const text = childAt(emphasis, 0, "text")
		expect(text.value).toBe("italic")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("italic canonicalizes '*' to '_'", () => {
		const input = `*italic*`
		const canonicalOutput = `_italic_`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const emphasis = childAt(para, 0, "emphasis")
		const text = childAt(emphasis, 0, "text")
		expect(text.value).toBe("italic")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("inline code", () => {
		const input = "`code`"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const inlineCode = childAt(para, 0, "inlineCode")
		expect(inlineCode.value).toBe("code")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("strikethrough", () => {
		const input = `~~strike~~`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const del = childAt(para, 0, "delete")
		const text = childAt(del, 0, "text")
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

		const code = expectNodeType(ast.children[0], "code")
		expect(code.lang).toBe("js")
		expect(code.value).toBe("const a = 1")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("fenced code without lang", () => {
		const input = "```\nplain code\n```"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const code = expectNodeType(ast.children[0], "code")
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

		const list = expectNodeType(ast.children[0], "list")
		expect(list.ordered).toBe(false)
		expect(list.children?.length).toBe(2)
		const firstItem = childAt(list, 0, "listItem")
		const firstParagraph = childAt(firstItem, 0, "paragraph")
		const text = childAt(firstParagraph, 0, "text")
		expect(text.value).toBe("one")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("unordered task list", () => {
		const input = `- [x] done\n- [ ] todo`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNodeType(ast.children[0], "list")
		expect(list.ordered).toBe(false)
		const first = childAt(list, 0, "listItem")
		expect(first.checked).toBe(true)
		const firstParagraph = childAt(first, 0, "paragraph")
		expect(childAt(firstParagraph, 0, "text").value).toBe("done")

		const second = childAt(list, 1, "listItem")
		expect(second.checked).toBe(false)
		const secondParagraph = childAt(second, 0, "paragraph")
		expect(childAt(secondParagraph, 0, "text").value).toBe("todo")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("ordered list", () => {
		const input = `1. one\n2. two`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNodeType(ast.children[0], "list")
		expect(list.ordered).toBe(true)
		expect(list.children?.length).toBe(2)
		const first = childAt(list, 0, "listItem")
		const firstParagraph = childAt(first, 0, "paragraph")
		expect(childAt(firstParagraph, 0, "text").value).toBe("one")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("ordered list with start", () => {
		const input = `3. three\n4. four`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = expectNodeType(ast.children[0], "list")
		expect(list.ordered).toBe(true)
		expect(list.start).toBe(3)
		expect(list.children?.length).toBe(2)
		const second = childAt(list, 1, "listItem")
		const secondParagraph = childAt(second, 0, "paragraph")
		expect(childAt(secondParagraph, 0, "text").value).toBe("four")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("blockquote", () => {
	test("single paragraph", () => {
		const input = `> quote`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const bq = expectNodeType(ast.children[0], "blockquote")
		const para = childAt(bq, 0, "paragraph")
		expect(childAt(para, 0, "text").value).toBe("quote")

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

		expectNodeType(ast.children[0], "thematicBreak")
		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("hard line break (two spaces)", () => {
		const input = `line  \nbreak`
		const canonicalOutput = `line\\\nbreak`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const hasBreak = (para.children ?? []).some((c) => c.type === "break")
		expect(hasBreak).toBe(true)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("hard line break (backslash at EOL)", () => {
		const input = `line\\\nbreak`
		const canonicalOutput = `line\\\nbreak`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = expectNodeType(ast.children[0], "paragraph")
		const hasBreak = (para.children ?? []).some((c) => c.type === "break")
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

		const para = expectNodeType(ast.children[0], "paragraph")
		const children = para.children ?? []
		const text1 = expectNodeType(children[0], "text")
		expect(text1.value).toBe("Hello ")
		const htmlOpen = expectNodeType(children[1], "html")
		expect(htmlOpen.value).toBe('<span class="x">')
		const textWorld = expectNodeType(children[2], "text")
		expect(textWorld.value).toBe("world")
		const htmlClose = expectNodeType(children[3], "html")
		expect(htmlClose.value).toBe("</span>")
		const textEnd = expectNodeType(children[4], "text")
		expect(textEnd.value).toBe(".")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("block html exact roundtrip", () => {
		const input = `<div class="wrap">\n<p>hello</p>\n</div>`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const html = expectNodeType(ast.children[0], "html")
		expect(html.value).toBe('<div class="wrap">\n<p>hello</p>\n</div>')

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("custom element with explicit open/close is allowed (inline html)", () => {
		const input = `<doc-figure src="/img.png"></doc-figure>`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		// Unknown/custom tags are treated as inline HTML inside a paragraph by remark-parse
		const para = expectNodeType(ast.children[0], "paragraph")
		const first = childAt(para, 0, "html")
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

		const para = expectNodeType(ast.children[0], "paragraph")
		const img = childAt(para, 0, "image")
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

		const para = expectNodeType(ast.children[0], "paragraph")
		const link = childAt(para, 0, "link")
		expect(link.url).toBe("https://example.com")
		expect(link.title).toBe("title")
		const txt = childAt(link, 0, "text")
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

		const table = expectNodeType(ast.children[0], "table")
		expect(Array.isArray(table.align)).toBe(true)
		expect((table.align ?? []).length).toBe(2)

		const rows = table.children ?? []
		const row1 = expectNodeType(rows[0], "tableRow")
		const row2 = expectNodeType(rows[1], "tableRow")
		expect(childAt(childAt(row1, 0, "tableCell"), 0, "text").value).toBe("a")
		expect(childAt(childAt(row1, 1, "tableCell"), 0, "text").value).toBe("b")
		expect(childAt(childAt(row2, 0, "tableCell"), 0, "text").value).toBe("1")
		expect(childAt(childAt(row2, 1, "tableCell"), 0, "text").value).toBe("2")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("gfm table canonicalizes compact pipes to spaced", () => {
		const input = `|a|b|\n|-|-|\n|1|2|`
		const canonicalOutput = `| a | b |\n| - | - |\n| 1 | 2 |`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const table = expectNodeType(ast.children[0], "table")
		expect(table.children?.length).toBe(2)
		const headerRow = childAt(table, 0, "tableRow")
		expect(childAt(childAt(headerRow, 0, "tableCell"), 0, "text").value).toBe("a")
		expect(childAt(childAt(headerRow, 1, "tableCell"), 0, "text").value).toBe("b")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})

describe("frontmatter (yaml)", () => {
	test("yaml exact roundtrip with heading", () => {
		const input = `---\ntitle: test\n---\n\n# Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const yaml = expectNodeType(ast.children[0], "yaml")
		expect(yaml.value).toBe("title: test")
		const heading = expectNodeType(ast.children[1], "heading")
		expect(heading.depth).toBe(1)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("canonicalizes missing blank line after yaml", () => {
		const input = `---\ntitle: test\n---\n# Heading`
		const canonicalOutput = `---\ntitle: test\n---\n\n# Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const yaml = expectNodeType(ast.children[0], "yaml")
		expect(yaml.value).toBe("title: test")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})
