import { describe, expect, test } from "vitest"
import { parseMarkdown } from "../ast/parse-markdown.js"
import { serializeAst } from "../ast/serialize-ast.js"
import { serializeToHtml } from "./serialize-to-html.js"
import { parseFromHtml } from "./parse-from-html.js"

const ensureTrailingNewline = (value: string) => (value.endsWith("\n") ? value : `${value}\n`)

async function roundtripHtml(markdown: string): Promise<string> {
	const ast = parseMarkdown(markdown)
	const html = await serializeToHtml(ast)
	const ast2 = await parseFromHtml(html)
	return serializeAst(ast2)
}

describe("html roundtrip (simplified)", () => {
	test("text roundtrip via html", async () => {
		const input = `Hello world.`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test.each([1, 2, 3])("heading h%d", async (level) => {
		const hashes = "#".repeat(level)
		const input = `${hashes} Heading`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("strong", async () => {
		const input = `**bold**`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("italic", async () => {
		const input = `_italic_`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("inline code", async () => {
		const input = "`code`"
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("strikethrough", async () => {
		const input = `~~strike~~`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("fenced code with lang (accept drop)", async () => {
		const input = "```js\nconst a = 1\n```"
		const result = await roundtripHtml(input)
		const canonicalOutputs = [input, "```\nconst a = 1\n```"].map(ensureTrailingNewline)
		expect(canonicalOutputs).toContain(result)
	})

	test("unordered list", async () => {
		const input = `- one\n- two`
		const result = await roundtripHtml(input)
		// HTML serialization makes lists loose; accept canonical loose markdown
		const canonical = `- one\n\n- two`
		expect(result).toBe(ensureTrailingNewline(canonical))
	})

	test("ordered list", async () => {
		const input = `1. one\n2. two`
		const result = await roundtripHtml(input)
		const canonical = `1. one\n\n2. two`
		expect(result).toBe(ensureTrailingNewline(canonical))
	})

	test("blockquote", async () => {
		const input = `> quote`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("thematic break", async () => {
		const input = `---`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("hard line break", async () => {
		const input = `line\\\nbreak`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("image with alt and title", async () => {
		const input = `![alt](https://example.com/a.png "title")`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("link with text and title", async () => {
		const input = `[text](https://example.com "title")`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})

	test("gfm table", async () => {
		const input = `| a | b |\n| - | - |\n| 1 | 2 |`
		const result = await roundtripHtml(input)
		expect(result).toBe(ensureTrailingNewline(input))
	})
})
