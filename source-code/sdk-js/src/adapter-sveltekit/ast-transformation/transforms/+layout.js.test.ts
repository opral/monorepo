import { describe, expect, test } from "vitest"
import { transformLayoutJs } from "./+layout.js.js"
import { baseTestConfig } from "./test-helpers/config.js"

describe("transformLayoutJs", () => {
	test("Insert into empty file with no options", () => {
		const code = ""
		const config = {
			...baseTestConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutJs(config, code, true)

		expect(transformed).toMatchInlineSnapshot(`
			"import { localStorageKey } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
			import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
			import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
			import { browser } from \\"$app/environment\\";
			export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});"
		`)
	})

	test("Insert into empty file with options", () => {
		const code = ""
		const config = {
			...baseTestConfig,
			languageInUrl: false,
		}
		const transformed = transformLayoutJs(config, code, true)

		expect(transformed).toMatchInlineSnapshot(`
			"import { localStorageKey } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
			import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
			import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
			import { browser } from \\"$app/environment\\";
			export const load = initRootLayoutLoadWrapper({
			  initDetectors: browser
			  ? () => [initLocalStorageDetector(localStorageKey), navigatorDetector]
			  : undefined
			}).wrap(async () => {});"
		`)
	})

	test("Wrap basic load function", () => {
		const code = `
export const load = async () => {};
		`
		const config = {
			...baseTestConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutJs(config, code, true)

		expect(transformed).toMatchInlineSnapshot(`
			"import { localStorageKey } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
			import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
			import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
			import { browser } from \\"$app/environment\\";
			export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});"
		`)
	})

	test("Wrap basic load function and merge incomplete imports", () => {
		const code = `
import { browser } from "$app/environment";
export const load = async () => {};
		`
		const config = {
			...baseTestConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutJs(config, code, true)

		expect(transformed).toMatchInlineSnapshot(`
			"import { localStorageKey } from \\"@inlang/sdk-js/adapter-sveltekit/client/reactive\\";
			import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
			import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
			import { browser } from \\"$app/environment\\";
			export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});"
		`)
	})
})

// NOTES
// - Allows merging of already present and required imports
// - adds an empty exported arrow function named load if not present
// - Wraps this load function (whether present or not) with initRootLayoutLoadWrapper().wrap()
// - Adds options to initRootLayoutLoadWrapper if necessary
