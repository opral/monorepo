import { describe, it, expect } from "vitest"
import { preprocess } from "./preprocess.js"

describe("preprocess", () => {
	it("removes nbsp if it's part of a heading", () => {
		const markdown = `#\u{00a0}Hello\n##\u{00a0}World`
		expect(preprocess(markdown)).toBe(`# Hello\n## World`)
	})

	it("replaces emojis that can't be rendered with text-equivalents", () => {
		const markdown = `1️⃣ 2️⃣ 3️⃣`
		expect(preprocess(markdown)).toBe(`1 2 3`)
	})
})
