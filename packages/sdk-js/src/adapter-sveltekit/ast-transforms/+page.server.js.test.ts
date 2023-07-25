import { describe, expect, test } from "vitest"
import { initTransformConfig } from "./test.utils.js"
import { transformPageServerJs } from "./+page.server.js.js"
import { dedent } from "ts-dedent"

// TODO: create test matrix for all possible combinations

describe("transformPageServerJs", () => {
	test("should not do anything if no SDK import is found", () => {
		const code = "export cons tload = () => ({ })"
		const config = initTransformConfig()
		const transformed = transformPageServerJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformPageServerJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformPageServerJs(
			"",
			initTransformConfig(),
			dedent`
				import { i } from '@inlang/sdk-js'

				export const load: PageServerLoad = ({ params }) => {
					return { title: i(params.slug) }
				}
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const load: PageServerLoad = initServerLoadWrapper().use(({ params }, { i }) => {
			    return { title: i(params.slug) };
			});"
		`)
	})
})
