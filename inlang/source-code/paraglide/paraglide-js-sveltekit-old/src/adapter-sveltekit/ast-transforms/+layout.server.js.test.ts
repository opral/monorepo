import dedent from "dedent"
import { describe, expect, test } from "vitest"
import { transformLayoutServerJs } from "./+layout.server.js.js"
import { initTestApp } from "./test.utils.js"

describe("transformLayoutServerJs", () => {
	describe("root", () => {
		test("empty file", () => {
			const code = ""
			const transformed = transformLayoutServerJs("", initTestApp(), code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initRootLayoutServerLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
				export const load = initRootLayoutServerLoadWrapper().use(() => { });"
			`)
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const transformed = transformLayoutServerJs("", initTestApp(), code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initRootLayoutServerLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
				export const load = initRootLayoutServerLoadWrapper().use(async () => { });"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTestApp()
			const transformed = transformLayoutServerJs("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = "import '@inlang/paraglide-js-sveltekit/no-transforms'"
		const config = initTestApp()
		const transformed = transformLayoutServerJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformLayoutServerJs(
			"",
			initTestApp(),
			dedent`
				import { language } from '@inlang/paraglide-js-sveltekit'
				import type { LayoutServerLoad } from '@sveltejs/kit'

				export const load: LayoutServerLoad = (async (() => {
					return { language }
				}))
			`,
			false,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initServerLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
			import type { LayoutServerLoad } from '@sveltejs/kit';
			export const load: LayoutServerLoad = initServerLoadWrapper().use((async((_, { language }) => {
			    return { language };
			})));"
		`)
	})
})
