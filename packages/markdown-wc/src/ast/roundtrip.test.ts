import { describe, expect, test } from "vitest"
import { parseMarkdown } from "./parse-markdown.js"
import { serializeAst } from "./serialize-ast.js"
import { validateAst } from "./validate-ast.js"

describe("root & paragraph", () => {
	test("paragraph text", () => {
		const input = `Hello world.`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		expect(ast.children[0]?.type).toBe("paragraph")
		expect(ast.children[0]?.children?.[0]?.value).toBe("Hello world.")

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

		const heading = ast.children[0]
		expect(heading?.type).toBe("heading")
		expect(heading?.depth).toBe(level)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("inline marks", () => {
	test("strong", () => {
		const input = `**bold**`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.type).toBe("strong")
		expect(para?.children?.[0]?.children?.[0]?.value).toBe("bold")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("strong canonicalizes '__' to '**'", () => {
		const input = `__bold__`
		const canonicalOutput = `**bold**`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.type).toBe("strong")
		expect(para?.children?.[0]?.children?.[0]?.value).toBe("bold")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("italic (underscore canonical)", () => {
		const input = `_italic_`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.type).toBe("emphasis")
		expect(para?.children?.[0]?.children?.[0]?.value).toBe("italic")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("italic canonicalizes '*' to '_'", () => {
		const input = `*italic*`
		const canonicalOutput = `_italic_`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.type).toBe("emphasis")
		expect(para?.children?.[0]?.children?.[0]?.value).toBe("italic")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})

	test("inline code", () => {
		const input = "`code`"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.type).toBe("inlineCode")
		expect(para?.children?.[0]?.value).toBe("code")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("strikethrough", () => {
		const input = `~~strike~~`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.type).toBe("delete")
		expect(para?.children?.[0]?.children?.[0]?.value).toBe("strike")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("code block", () => {
	test("fenced code with lang", () => {
		const input = "```js\nconst a = 1\n```"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const code = ast.children[0]
		expect(code?.type).toBe("code")
		expect(code?.lang).toBe("js")
		expect(code?.value).toBe("const a = 1")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("fenced code without lang", () => {
		const input = "```\nplain code\n```"
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const code = ast.children[0]
		expect(code?.type).toBe("code")
		expect(code?.lang).toBe(null)
		expect(code?.value).toBe("plain code")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("lists", () => {
	test("unordered simple", () => {
		const input = `- one\n- two`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = ast.children[0]
		expect(list?.type).toBe("list")
		expect(list?.ordered).toBe(false)
		expect(list?.children?.length).toBe(2)
		expect(list?.children?.[0]?.type).toBe("listItem")
		expect(list?.children?.[0]?.children?.[0]?.type).toBe("paragraph")
		expect(list?.children?.[0]?.children?.[0]?.children?.[0]?.value).toBe("one")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("unordered task list", () => {
		const input = `- [x] done\n- [ ] todo`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = ast.children[0]
		expect(list?.type).toBe("list")
		expect(list?.ordered).toBe(false)
			const items = list?.children ?? []
		expect(items[0]?.type).toBe("listItem")
		expect(items[0]?.checked).toBe(true)
		expect(items[0]?.children?.[0]?.children?.[0]?.value).toBe("done")
		expect(items[1]?.checked).toBe(false)
		expect(items[1]?.children?.[0]?.children?.[0]?.value).toBe("todo")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("ordered list", () => {
		const input = `1. one\n2. two`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = ast.children[0]
		expect(list?.type).toBe("list")
		expect(list?.ordered).toBe(true)
		expect(list?.children?.length).toBe(2)
		expect(list?.children?.[0]?.children?.[0]?.children?.[0]?.value).toBe("one")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("ordered list with start", () => {
		const input = `3. three\n4. four`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const list = ast.children[0]
		expect(list?.type).toBe("list")
		expect(list?.ordered).toBe(true)
		expect(list?.start).toBe(3)
		expect(list?.children?.length).toBe(2)
		expect(list?.children?.[1]?.children?.[0]?.children?.[0]?.value).toBe("four")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("blockquote", () => {
	test("single paragraph", () => {
		const input = `> quote`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const bq = ast.children[0]
		expect(bq?.type).toBe("blockquote")
		const para = bq?.children?.[0]
		expect(para?.type).toBe("paragraph")
		expect(para?.children?.[0]?.value).toBe("quote")

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

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
			const children = para?.children ?? []
			const [t1, htmlOpen, tWorld, htmlClose, t2] = children
		expect(t1?.type).toBe("text")
		expect(t1?.value).toBe("Hello ")
		expect(htmlOpen?.type).toBe("html")
		expect(htmlOpen?.value).toBe('<span class="x">')
		expect(tWorld?.type).toBe("text")
		expect(tWorld?.value).toBe("world")
		expect(htmlClose?.type).toBe("html")
		expect(htmlClose?.value).toBe("</span>")
		expect(t2?.type).toBe("text")
		expect(t2?.value).toBe(".")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("block html exact roundtrip", () => {
		const input = `<div class="wrap">\n<p>hello</p>\n</div>`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const html = ast.children[0]
		expect(html?.type).toBe("html")
		expect(html?.value).toBe('<div class="wrap">\n<p>hello</p>\n</div>')

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("custom element with explicit open/close is allowed (inline html)", () => {
		const input = `<doc-figure src="/img.png"></doc-figure>`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		// Unknown/custom tags are treated as inline HTML inside a paragraph by remark-parse
		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		const first = para?.children?.[0]
		expect(first?.type).toBe("html")
		expect(first?.value).toContain("doc-figure")

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

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		const img = para?.children?.[0]
		expect(img?.type).toBe("image")
		expect(img?.url).toBe("https://example.com/a.png")
		expect(img?.alt).toBe("alt")
		expect(img?.title).toBe("title")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("link with text and title (exact roundtrip)", () => {
		const input = `[text](https://example.com "title")`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const para = ast.children[0]
		expect(para?.type).toBe("paragraph")
		const link = para?.children?.[0]
		expect(link?.type).toBe("link")
		expect(link?.url).toBe("https://example.com")
		expect(link?.title).toBe("title")
		const txt = link?.children?.[0]
		expect(txt?.type).toBe("text")
		expect(txt?.value).toBe("text")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})
})

describe("table", () => {
	test("gfm table exact roundtrip", () => {
		const input = `| a | b |\n| - | - |\n| 1 | 2 |`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const table = ast.children[0]
		expect(table?.type).toBe("table")
		expect(Array.isArray(table?.align)).toBe(true)
			const align = table?.align
			expect(Array.isArray(align) ? align.length : 0).toBe(2)

			const rows = table?.children ?? []
			const [row1, row2] = rows
		expect(row1?.type).toBe("tableRow")
		expect(row1?.children?.[0]?.type).toBe("tableCell")
		expect(row1?.children?.[0]?.children?.[0]?.value).toBe("a")
		expect(row1?.children?.[1]?.children?.[0]?.value).toBe("b")
		expect(row2?.children?.[0]?.children?.[0]?.value).toBe("1")
		expect(row2?.children?.[1]?.children?.[0]?.value).toBe("2")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("gfm table canonicalizes compact pipes to spaced", () => {
		const input = `|a|b|\n|-|-|\n|1|2|`
		const canonicalOutput = `| a | b |\n| - | - |\n| 1 | 2 |`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const table = ast.children[0]
		expect(table?.type).toBe("table")
		expect(table?.children?.length).toBe(2)
		expect(table?.children?.[0]?.children?.[0]?.children?.[0]?.value).toBe("a")
		expect(table?.children?.[0]?.children?.[1]?.children?.[0]?.value).toBe("b")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})

describe("frontmatter (yaml)", () => {
	test("yaml exact roundtrip with heading", () => {
		const input = `---\ntitle: test\n---\n\n# Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const yaml = ast.children[0]
		expect(yaml?.type).toBe("yaml")
		expect(yaml?.value).toBe("title: test")
		const heading = ast.children[1]
		expect(heading?.type).toBe("heading")
		expect(heading?.depth).toBe(1)

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(input)
	})

	test("canonicalizes missing blank line after yaml", () => {
		const input = `---\ntitle: test\n---\n# Heading`
		const canonicalOutput = `---\ntitle: test\n---\n\n# Heading`
		const ast = parseMarkdown(input)
		const out = serializeAst(ast)

		const yaml = ast.children[0]
		expect(yaml?.type).toBe("yaml")
		expect(yaml?.value).toBe("title: test")

		expect(validateAst(ast)).toBe(true)
		expect(out).toBe(canonicalOutput)
	})
})
