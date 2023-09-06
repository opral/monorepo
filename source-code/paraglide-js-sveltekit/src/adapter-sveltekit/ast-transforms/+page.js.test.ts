import { describe, expect, test } from "vitest"
import dedent from "dedent"
import { initTestApp } from "./test.utils.js"
import { transformPageJs } from "./+page.js.js"

// TODO: create test matrix for all possible combinations

describe("transformPageJs", () => {
	describe("root", () => {
		describe("empty file", () => {
			describe("lang-in-slug", () => {
				test("non-static", () => {
					const code = ""
					const config = initTestApp({ options: { languageInUrl: true } })
					const transformed = transformPageJs("", config, code, true)

					expect(transformed).toMatchInlineSnapshot(`
						"import { initRootPageLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
						import { browser } from '$app/environment';
						export const load = initRootPageLoadWrapper({
						    browser
						}).use(() => { });"
					`)
				})

				test("static", () => {
					const code = ""
					const config = initTestApp({
						options: {
							languageInUrl: true,
							isStatic: true,
						},
					})
					const transformed = transformPageJs("", config, code, true)

					expect(transformed).toMatchInlineSnapshot(`
						"import { redirect } from '@sveltejs/kit';
						import { initLocalStorageDetector, navigatorDetector } from '@inlang/paraglide-js-sveltekit/detectors/client';
						import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
						import { browser } from '$app/environment';
						export const load = initRootPageLoadWrapper({
						    browser,
						    initDetectors: () => [navigatorDetector],
						    redirect: {
						        throwable: redirect,
						        getPath: ({ url }, languageTag) => replaceLanguageInUrl(new URL(url), languageTag),
						    },
						}).use(() => { });"
					`)
				})
			})
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const config = initTestApp({ options: { languageInUrl: true } })
			const transformed = transformPageJs("", config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initRootPageLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
				import { browser } from '$app/environment';
				export const load = initRootPageLoadWrapper({
				    browser
				}).use(async () => { });"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTestApp()
			const transformed = transformPageJs("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = "import '@inlang/paraglide-js-sveltekit/no-transforms'"
		const config = initTestApp()
		const transformed = transformPageJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformPageJs(
			"",
			initTestApp(),
			dedent`
				import { languages } from '@inlang/paraglide-js-sveltekit'

				export const load = async (() => {
					return { languages }
				})
			`,
			true,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRootPageLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/shared';
			import { browser } from '$app/environment';
			export const load = initRootPageLoadWrapper({
			    browser
			}).use(async((_, { languages }) => {
			    return { languages };
			}));"
		`)
	})
})
