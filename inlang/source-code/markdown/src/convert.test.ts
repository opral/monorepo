import { convert } from "./convert.js"
import { test, expect } from "vitest"

test("should convert markdown to html", async () => {
	const markdown = `
# Hello World`
	const html = await convert(markdown)
	expect(html).toContain("<h1")
})
