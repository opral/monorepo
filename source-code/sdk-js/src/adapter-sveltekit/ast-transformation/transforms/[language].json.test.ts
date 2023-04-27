import { describe, it } from "vitest"
import { transformLanguageJson } from "../transforms/[language].json.js"

describe("transformLanguageJson", () => {
	// todo: cover with real test once this implemented
	it("temporarily throws error", ({ expect }) => {
		expect(() => transformLanguageJson({}, "anything")).toThrowError("currently not supported")
	})

	it("creates new file", ({ expect }) => {
		const code = transformLanguageJson({}, "")
		expect(code).toMatchSnapshot()
	})
})
