import { describe, it } from "vitest"
import { transformHooksServerJs } from "../transforms/hooks.server.js.js"
import { baseTestConfig } from "./test-helpers/config.js"
import type { TransformConfig } from "../config.js"

describe("transformHooksServerJs", () => {
	it("returns new file if no code provided", ({ expect }) => {
		const code = transformHooksServerJs(baseTestConfig, "")
		expect(code).toContain("getLanguage")
	})
	it("languageInUrl and isStatic", ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			languageInUrl: true,
			isStatic: true,
		}
		const code = transformHooksServerJs(config, "")
		expect(code).toMatchSnapshot()
	})

	it("isStatic", ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			isStatic: true,
		}
		const code = transformHooksServerJs(config, "")
		expect(code).toMatchSnapshot()
	})
})

// NOTES
// Only one function for everything (transformHooksServerJs)
// Capabilities:
// 1. merge required imports with current imports
// 2. wrap existing load statement
// 3. Retain other, load unrelated statements
