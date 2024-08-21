import { describe, it, expect } from "vitest"
import { serializeICU1Message } from "./serialize.js"
import { parse as parseICU1 } from "@formatjs/icu-messageformat-parser"

describe("serializeICU1Message", () => {
	it("serializes text", () => {
		const ast = parseICU1("Hello, {name}!")
		expect(serializeICU1Message(ast)).toBe("Hello, {name}!")
	})

	it("serializes select", () => {
		const ast = parseICU1(
			"It's, {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}!",
			{ requiresOtherClause: false }
		)
		expect(serializeICU1Message(ast)).toBe(
			"It's, {season, select, spring {spring} summer {summer} fall {fall} winter {winter}}!"
		)
	})

	it("serializes plurals", () => {
		const ast = parseICU1("{likes, plural, =0 {No Likes} one {One Like} other {# Likes}}", {
			requiresOtherClause: false,
		})
		expect(serializeICU1Message(ast)).toBe(
			"{likes, plural, =0 {No Likes} one {One Like} other {# Likes}}"
		)
	})
})
