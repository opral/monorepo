import { describe, expect, test } from "vitest"
import dedent from "dedent"
import { initTestApp } from "./test.utils.js"
import { transformLayoutJs } from "./+layout.js.js"

// TODO: create test matrix for all possible combinations

describe("transformLayoutJs", () => {
	describe("root", () => {
		describe("empty file", () => {
			test("lang-in-slug", () => {
				const code = ""
				const config = initTestApp({ options: { languageInUrl: true } })
				const transformed = transformLayoutJs("", config, code, true)

				expect(transformed).toMatchInlineSnapshot(`
					"if (import.meta.hot) {
					    import.meta.hot.on('inlang-messages-changed', async () => {
					        location.reload();
					    });
					}
					import { initRootLayoutLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
					export const load = initRootLayoutLoadWrapper({}).use(() => { });"
				`)
			})

			test("spa", () => {
				const code = ""
				const config = initTestApp()
				const transformed = transformLayoutJs("", config, code, true)

				expect(transformed).toMatchInlineSnapshot(`
					"if (import.meta.hot) {
					    import.meta.hot.on('inlang-messages-changed', async () => {
					        location.reload();
					    });
					}
					import { initLocalStorageDetector, navigatorDetector } from '@inlang/paraglide-js-sveltekit/detectors/client';
					import { browser } from '$app/environment';
					import { initRootLayoutLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
					export const load = initRootLayoutLoadWrapper({
					    initDetectors: browser
					        ? () => [initLocalStorageDetector(), navigatorDetector]
					        : undefined
					}).use(() => { });"
				`)
			})
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const config = initTestApp({ options: { languageInUrl: true } })
			const transformed = transformLayoutJs("", config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"if (import.meta.hot) {
				    import.meta.hot.on('inlang-messages-changed', async () => {
				        location.reload();
				    });
				}
				import { initRootLayoutLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				export const load = initRootLayoutLoadWrapper({}).use(async () => { });"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTestApp()
			const transformed = transformLayoutJs("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = "import '@inlang/paraglide-js-sveltekit/no-transforms'"
		const config = initTestApp()
		const transformed = transformLayoutJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformLayoutJs(
			"",
			initTestApp(),
			dedent`
				import { languages } from '@inlang/paraglide-js-sveltekit'
				import type { LayoutLoad } from '@sveltejs/kit'

				export const load = async (() => {
					return { languages }
				}) satisfies LayoutLoad
			`,
			false,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"if (import.meta.hot) {
			    import.meta.hot.on('inlang-messages-changed', async () => {
			        location.reload();
			    });
			}
			import { initLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
			import type { LayoutLoad } from '@sveltejs/kit';
			export const load = initLoadWrapper().use(async((_, { languages }) => {
			    return { languages };
			}) satisfies LayoutLoad);"
		`)
	})
})
