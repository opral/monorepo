import { describe, expect, test } from "vitest"
import { transformHooksServerJs } from "./hooks.server.js.js"

describe("hooks.server.js.ts", () => {
	const baseConfig = {
		isStatic: true,
		srcFolder: "",
		rootRoutesFolder: "",
		hasAlreadyBeenInitialized: true,
	}
	const requiredImports = `import { replaceLanguageInUrl } from "@inlang/sdk-js/adapter-sveltekit/shared";
import { redirect } from "@sveltejs/kit";
import { initAcceptLanguageHeaderDetector } from "@inlang/sdk-js/detectors/server";
import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server";`
	test("Insert into empty file with no options", () => {
		const code = ""
		const config = {
			languageInUrl: true,
			...baseConfig,
		}
		const transformed = transformHooksServerJs(config, code)
		const expected = `${requiredImports}
export const handle = initHandleWrapper({
  getLanguage: ({ url }) => url.pathname.split("/")[1]
}).wrap(async ({ event, resolve }) => resolve(event));`
		expect(transformed).toBe(expected)
	})
})
