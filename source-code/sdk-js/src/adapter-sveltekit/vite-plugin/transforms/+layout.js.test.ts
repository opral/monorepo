import { describe, expect, test } from "vitest"
import { transformLayoutJs } from "./+layout.js.js"
import { getTransformConfig } from "./test-helpers/config.js"
import { dedent } from "ts-dedent"

// TODO: create test matrix for all possible combinations

describe("transformLayoutJs", () => {
	describe("root", () => {
		describe("empty file", () => {
			test("lang-in-slug", () => {
				const code = ""
				const config = getTransformConfig({ languageInUrl: true, })
				const transformed = transformLayoutJs(config, code, true)

				expect(transformed).toMatchInlineSnapshot(`
					"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
					import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
					import { browser } from '$app/environment';
					export const load = initRootLayoutLoadWrapper().use(() => {
					});"
				`)
			})

			test("spa", () => {
				const code = ""
				const config = getTransformConfig()
				const transformed = transformLayoutJs(config, code, true)

				expect(transformed).toMatchInlineSnapshot(`
					"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
					import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
					import { browser } from '$app/environment';
					export const load = initRootLayoutLoadWrapper({
					    initDetectors: browser
					        ? () => [initLocalStorageDetector(), navigatorDetector]
					        : undefined
					}).use(() => {
					});"
				`)
			})
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const config = getTransformConfig({ languageInUrl: true })
			const transformed = transformLayoutJs(config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';
				export const load = initRootLayoutLoadWrapper().use(async () => {
				});"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = getTransformConfig()
			const transformed = transformLayoutJs(config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = getTransformConfig()
		const transformed = transformLayoutJs(config, code, true)
		expect(transformed).toEqual(code)
	})

	describe("'@inlang/sdk-js' imports", () => {
		test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
			const code = "import { i } from '@inlang/sdk-js'"
			const config = getTransformConfig()
			expect(() => transformLayoutJs(config, code, true)).toThrow()
		})

		test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
			const code =
				"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
			const config = getTransformConfig()
			expect(() => transformLayoutJs(config, code, true)).not.toThrow()
		})
	})
})
