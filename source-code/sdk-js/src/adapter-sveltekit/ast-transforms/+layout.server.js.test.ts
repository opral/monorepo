import { dedent } from "ts-dedent"
import { describe, expect, test } from "vitest"
import { transformLayoutServerJs } from "./+layout.server.js.js"
import { initTransformConfig } from "./test.utils.js"

describe("transformLayoutServerJs", () => {
	describe("root", () => {
		test("empty file", () => {
			const code = ""
			const transformed = transformLayoutServerJs("", initTransformConfig(), code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initRootLayoutServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
				export const load = initRootLayoutServerLoadWrapper().use(() => { });"
			`)
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const transformed = transformLayoutServerJs("", initTransformConfig(), code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initRootLayoutServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
				export const load = initRootLayoutServerLoadWrapper().use(async () => { });"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTransformConfig()
			const transformed = transformLayoutServerJs("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformLayoutServerJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformLayoutServerJs(
			"",
			initTransformConfig(),
			dedent`
				import { language } from '@inlang/sdk-js'
				import type { LayoutServerLoad } from '@sveltejs/kit'

				export const load: LayoutServerLoad = (async (() => {
					return { language }
				}))
			`,
			false,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			import type { LayoutServerLoad } from '@sveltejs/kit';
			export const load: LayoutServerLoad = initServerLoadWrapper().use((async((_, { language }) => {
			    return { language };
			})));"
		`)
	})
})
