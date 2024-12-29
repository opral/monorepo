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
custom_elements: 
  doc-figure: "https://cdn.skypack.dev/@doc-elements/figure"
---
# Hello World

<doc-figure label="Hello world"></doc-figure>
	`
	const parsed = await parse(markdown)
	expect(parsed.html).toContain("<doc-figure")
	expect(parsed.frontmatter.custom_elements).toEqual({
		"doc-figure": "https://cdn.skypack.dev/@doc-elements/figure",
	})
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
	expect(parsed.frontmatter).toEqual({ custom_elements: {} })
})
