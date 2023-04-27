import { describe, it } from "vitest"
import {
	transformHooksServerJs,
	wrapHooksServerJs,
	createHooksServerJs,
} from "../transforms/hooks.server.js.js"
import { baseTestConfig } from "./test-helpers/config.js"
import type { TransformConfig } from "../config.js"

describe("transformHooksServerJs", () => {
	it("returns new file if no code provided", ({ expect }) => {
		const code = transformHooksServerJs(baseTestConfig, "")
		expect(code).toContain("getLanguage")
	})
})
describe("wrapHooksServerJs", () => {
	// todo: cover with real test once this implemented
	it("temporarily throws error", ({ expect }) => {
		expect(() => wrapHooksServerJs(baseTestConfig, "anything")).toThrowError(
			"currently not supported",
		)
	})
})

describe("createHooksServerJs", () => {
	it("languageInUrl and isStatic", ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			languageInUrl: true,
			isStatic: true,
		}
		const code = createHooksServerJs(config)
		expect(code).toMatchSnapshot()
	})

	it("isStatic", ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			isStatic: true,
		}
		const code = createHooksServerJs(config)
		expect(code).toMatchSnapshot()
	})
})
