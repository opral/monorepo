import { describe, it } from "vitest"
import type { TransformConfig } from '../config.js'
import { transformLanguageJson } from "../transforms/[language].json.js"

describe("transformLanguageJson", () => {
	// todo: cover with real test once this implemented
	it("temporarily throws error", ({ expect }) => {
		expect(() => transformLanguageJson({} as TransformConfig, "anything")).toThrowError("currently not supported")
	})

	it("creates new file", ({ expect }) => {
		const code = transformLanguageJson({} as TransformConfig, "")
		expect(code).toMatchSnapshot()
	})
})
