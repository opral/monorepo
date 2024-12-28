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

test("should be able to render custom elements", async () => {
	const markdown = `
# Hello World

<doc-figure label="Hello world"></doc-figure>
	`
	const html = (await parse(markdown)).html
	expect(html).toContain("<doc-figure")
})

test("should be able to provide a badge generator", async () => {
	const markdown = `
<inlang-badge-generator></inlang-badge-generator>
	`
	const html = (await parse(markdown)).html
	expect(html).toContain("<inlang-badge-generator></inlang-badge-generator>")
})

test("should be able to display a comment", async () => {
	const markdown = `
<doc-comment text="Test comment." name="John Doe"></doc-comment>
	`
	const html = (await parse(markdown)).html
	expect(html).toContain("<doc-comment")
})

test("should be able to use frontmatter", async () => {
	const markdown = `---
title: test
description: test
---

# Hello World
This is markdown
	`
	const result = await parse(markdown)
	expect(result.html).toContain("<h1")
	expect(result.data.frontmatter.title).toBeDefined()
})

test("should throw if frontmatter type is not valid", async () => {
	const markdown = `---
title: test
---

# Hello World
This is markdown
	`
	try {
		await parse(markdown)
	} catch (e: any) {
		expect(e.message).toContain("Frontmatter is not valid")
	}
})
