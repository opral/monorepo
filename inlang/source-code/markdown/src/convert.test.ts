import { convert } from "./convert.js"
import { test, expect } from "vitest"

test("should convert simple markdown to html", async () => {
	const markdown = `
# Hello World`
	const html = await convert(markdown)
	expect(html).toContain("<h1")
})

test("should syntax highlight code", async () => {
	const markdown = `
\`\`\`js
const a = 1
\`\`\`
	`
	const html = await convert(markdown)
	expect(html).toContain("<code")
})

test("should draw mermaid diagrams", async () => {
	const markdown = `
\`\`\`mermaid
graph TD
A[Hard edge] -->|Link text| B(Round edge)
B --> C{Decision}
C -->|One| D[Result one]
C -->|Two| E[Result two]
\`\`\`
	`
	const html = await convert(markdown)
	expect(html).toContain("<svg")
})

test("should be able to render custom elements", async () => {
	const markdown = `
# Hello World

<doc-figure label="Hello world"></doc-figure>
	`
	const html = await convert(markdown)
	expect(html).toContain("<doc-figure")
})
