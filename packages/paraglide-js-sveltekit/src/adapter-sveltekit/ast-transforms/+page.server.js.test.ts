import { describe, expect, test } from "vitest"
import { initTestApp } from "./test.utils.js"
import { transformPageServerJs } from "./+page.server.js.js"
import dedent from "dedent"

// TODO: create test matrix for all possible combinations

describe("transformPageServerJs", () => {
	test("should not do anything if no SDK import is found", () => {
		const code = "export cons tload = () => ({ })"
		const config = initTestApp()
		const transformed = transformPageServerJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = "import '@inlang/paraglide-js-sveltekit/no-transforms'"
		const config = initTestApp()
		const transformed = transformPageServerJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformPageServerJs(
			"",
			initTestApp(),
			dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				export const load: PageServerLoad = ({ params }) => {
					return { title: i(params.slug) }
				}
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initServerLoadWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
			export const load: PageServerLoad = initServerLoadWrapper().use(({ params }, { i }) => {
			    return { title: i(params.slug) };
			});"
		`)
	})
})
