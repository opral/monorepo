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
		expect(code).toMatchInlineSnapshot(`
			"import { replaceLanguageInUrl } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
			import { redirect } from \\"@sveltejs/kit\\";
			import { initAcceptLanguageHeaderDetector } from \\"@inlang/sdk-js/detectors/server\\";
			import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
			export const handle = initHandleWrapper({
			  getLanguage: ({ url }) => url.pathname.split(\\"/\\")[1]
			}).wrap(async ({ event, resolve }) => resolve(event));"
		`)
	})

	it("isStatic", ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			isStatic: true,
		}
		const code = transformHooksServerJs(config, "")
		expect(code).toMatchInlineSnapshot(`
			"import { replaceLanguageInUrl } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
			import { redirect } from \\"@sveltejs/kit\\";
			import { initAcceptLanguageHeaderDetector } from \\"@inlang/sdk-js/detectors/server\\";
			import { initHandleWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
			export const handle = initHandleWrapper({
			  getLanguage: () => undefined
			}).wrap(async ({ event, resolve }) => resolve(event));"
		`)
	})
})

// NOTES
// Only one function for everything (transformHooksServerJs)
// Capabilities:
// 1. merge required imports with current imports
// 2. wrap existing load statement
// 3. Retain other, load unrelated statements
