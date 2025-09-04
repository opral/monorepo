// @vitest-environment jsdom
import { describe, expect, test } from "vitest"
import { Editor } from "@tiptap/core"
import { MarkdownWc } from "./markdown-wc.js"
import { astToTiptapDoc } from "./mdwc-to-tiptap.js"
import { parseMarkdown } from "../ast/parse-markdown.js"
import { serializeToHtml } from "../html/serialize-to-html.js"

async function htmlFromEditor(markdown: string): Promise<string> {
	const ast = parseMarkdown(markdown) as any
	const pmDoc = astToTiptapDoc(ast)
	const editor = new Editor({ extensions: MarkdownWc(), content: pmDoc as any })
	return editor.getHTML()
}

async function htmlFromSerializer(markdown: string): Promise<string> {
	const ast = parseMarkdown(markdown) as any
	return await serializeToHtml(ast)
}

async function expectEditorHtmlEqualsSerializer(markdown: string) {
	const [fromEditor, fromSerializer] = await Promise.all([
		htmlFromEditor(markdown),
		htmlFromSerializer(markdown),
	])
	expect(fromEditor).toBe(fromSerializer)
}

describe("TipTap HTML matches serializeToHtml", () => {
	test("paragraph", async () => {
		await expectEditorHtmlEqualsSerializer("Hello world.")
	})

	test.each([1, 2, 3])("heading h%d", async (level) => {
		const hashes = "#".repeat(level)
		await expectEditorHtmlEqualsSerializer(`${hashes} Heading`)
	})

	test("unordered list", async () => {
		await expectEditorHtmlEqualsSerializer(`- one\n- two`)
	})

	test("ordered list with start", async () => {
		await expectEditorHtmlEqualsSerializer(`3. three\n4. four`)
	})

	test("blockquote", async () => {
		await expectEditorHtmlEqualsSerializer(`> quote`)
	})

	test("code block with lang", async () => {
		await expectEditorHtmlEqualsSerializer("```js\nconst a = 1\n```")
	})

	test("hr", async () => {
		await expectEditorHtmlEqualsSerializer(`---`)
	})

	test("hard break", async () => {
		await expectEditorHtmlEqualsSerializer(`line\\\nbreak`)
	})

	test("image", async () => {
		await expectEditorHtmlEqualsSerializer(`![alt](https://example.com/a.png "title")`)
	})

	test("link", async () => {
		await expectEditorHtmlEqualsSerializer(`[text](https://example.com "title")`)
	})
})
