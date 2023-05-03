import { describe, expect, test } from "vitest"
import { transformLayoutServerJs } from "./+layout.server.js.js"
import { baseTestConfig } from "./test-helpers/config.js"

describe("transformLayoutServerJs", () => {
	test("Insert into empty file with no options", () => {
		const code = ""
		const config = {
			...baseTestConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutServerJs(config, code, true)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRootServerLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/server\\";
			export const load = initRootServerLayoutLoadWrapper().wrap(async () => {});"
		`)
	})
})

// NOTES @stepan
// - Allows merging of already present and required imports
// - adds an empty exported arrow function named load if not present
// - Wraps this load function (whether present or not) with initRootServerLayoutLoadWrapper().wrap()
// - Adds options to initRootServerLayoutLoadWrapper if necessary
