import { parse } from "./parse.js"
import { test, expect } from "vitest"

test("should parse simple markdown to html", async () => {
	const markdown = `
# Hello World`
	const html = (await parse(markdown)).html
	expect(html).toContain("<h1")
})

test("should syntax highlight code", async () => {
	const markdown = `
\`\`\`js
const a = 1
\`\`\`
	`
	const html = (await parse(markdown)).html
	expect(html).toContain("<code")
})

/* This test takes some time */
test.skip("should draw mermaid diagrams", async () => {
	const markdown = `
\`\`\`mermaid
graph TD
A[Hard edge] -->|Link text| B(Round edge)
B --> C{Decision}
C -->|One| D[Result one]
C -->|Two| E[Result two]
\`\`\`
	`
	const html = (await parse(markdown)).html
	expect(html).toContain("<svg")
})

test("leaves imported custom elements as is", async () => {
	const markdown = `---
imports: 
  - "https://cdn.skypack.dev/doc-figure.js"
---
# Hello World

<doc-figure label="Hello world"></doc-figure>
	`
	const parsed = await parse(markdown)
	expect(parsed.html).toContain('<doc-figure label="Hello world"></doc-figure>')
	expect(parsed.detectedCustomElements).toEqual(["doc-figure"])
	expect(parsed.frontmatter.imports).toEqual(["https://cdn.skypack.dev/doc-figure.js"])
})

test("additional frontmatter properties", async () => {
	const markdown = `---
title: test_title
description: test_description
---

# Hello World
This is markdown
	`
	const result = await parse(markdown)
	expect(result.html).toContain("<h1")
	expect(result.frontmatter.title).toEqual("test_title")
	expect(result.frontmatter.description).toEqual("test_description")
})

test("no frontmatter defined", async () => {
	const markdown = `
# Hello World
This is markdown
	`
	const parsed = await parse(markdown)
	expect(parsed.html).toContain("<h1")
	expect(parsed.frontmatter).toEqual({})
})

test("only injects css if code blocks are present", async () => {
	const markdown = `
# Hello World
This is markdown
	`
	const parsed = await parse(markdown)
	expect(parsed.html).not.toContain('<link rel="stylesheet"')

	const markdownWithCode = `
\`\`\`js
const a = 1
\`\`\`
	`
	const parsedWithCode = await parse(markdownWithCode)
	expect(parsedWithCode.html).toContain('<link rel="stylesheet"')
})

test("can render mermaid diagrams", async () => {
	const markdown = `
\`\`\`mermaid
graph TD
A --> B
\`\`\`	
	`

	const parsed = await parse(markdown)

	expect(parsed.html).toContain("<markdown-wc-mermaid>")
	expect(parsed.frontmatter.imports).toEqual([
		"https://cdn.jsdelivr.net/npm/@opral/markdown-wc/dist/markdown-wc-mermaid.js",
	])
})
