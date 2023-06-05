import { describe, expect, test } from "vitest"
import { transformLayoutJs } from "./+layout.js.js"
import { getTransformConfig } from "./test-helpers/config.js"
import { dedent } from "ts-dedent"

describe("transformLayoutJs", () => {
	describe("root=true", () => {
		test("Insert into empty file with no options", () => {
			const code = ""
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformLayoutJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
				import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
				import { browser } from \\"$app/environment\\";
				export const load = initRootLayoutLoadWrapper({}).wrap(() => {});"
			`)
		})

		test("Insert into empty file with options", () => {
			const code = ""
			const config = {
				...getTransformConfig(),
				languageInUrl: false,
			}
			const transformed = transformLayoutJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
				import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
				import { browser } from \\"$app/environment\\";

				export const load = initRootLayoutLoadWrapper({
				  initDetectors: browser
				  ? () => [initLocalStorageDetector(), navigatorDetector]
				  : undefined
				}).wrap(() => {});"
			`)
		})

		test("Wrap basic load function", () => {
			const code = dedent`
				export const load = async () => {};
			`
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformLayoutJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
				import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
				import { browser } from \\"$app/environment\\";
				export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});"
			`)
		})

		test("Wrap basic load function and merge incomplete imports", () => {
			const code = dedent`
				import { browser } from "$app/environment";
				export const load = async () => {};
			`
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformLayoutJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
				import { initRootLayoutLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
				import { browser } from \\"$app/environment\\";
				export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});"
			`)
		})
	})
	describe("root=false", () => {
		test("Wrap basic load function", () => {
			const code = dedent`
				export const load = async () => {};
			`
			const config = {
				...getTransformConfig(),
				languageInUrl: true,
			}
			const transformed = transformLayoutJs(config, code, false)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from \\"@inlang/sdk-js/detectors/client\\";
				import { initLoadWrapper } from \\"@inlang/sdk-js/adapter-sveltekit/shared\\";
				import { browser } from \\"$app/environment\\";
				export const load = initLoadWrapper({}).wrap(async () => {});"
			`)
		})
	})
})

// NOTES
// - Allows merging of already present and required imports
// - adds an empty exported arrow function named load if not present
// - Wraps this load function (whether present or not) with initRootLayoutLoadWrapper().wrap()
// - Adds options to initRootLayoutLoadWrapper if necessary
