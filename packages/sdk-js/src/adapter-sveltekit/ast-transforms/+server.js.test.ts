import { describe, expect, test } from "vitest"
import { initTransformConfig } from "./test.utils.js"
import { transformServerRequestJs } from "./+server.js.js"
import { dedent } from "ts-dedent"

// TODO: create test matrix for all possible combinations

describe("transformServerRequestJs", () => {
	test("should not do anything if no SDK import is found", () => {
		const code = "export const GET = () => new Repsonse('hi')"
		const config = initTransformConfig()
		const transformed = transformServerRequestJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformServerRequestJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformServerRequestJs(
			"",
			initTransformConfig(),
			dedent`
				import { i } from '@inlang/sdk-js'

				export const GET = () => new Repsonse(i('hi'))
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRequestHandlerWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const GET = initRequestHandlerWrapper().use((_, { i }) => new Repsonse(i('hi')));"
		`)
	})

	test("should transform function declaration to function expression", () => {
		const transformed = transformServerRequestJs(
			"",
			initTransformConfig(),
			dedent`
				import { languages } from '@inlang/sdk-js'

				export async function POST() {
					return { languages }
				}
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRequestHandlerWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			export const POST = initRequestHandlerWrapper().use(async function POST(_, { languages }) {
			    return { languages };
			});"
		`)
	})

	test("should transform multiple '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformServerRequestJs(
			"",
			initTransformConfig(),
			dedent`
				import { json } from '@sveltejs/kit'
				import { i, language } from '@inlang/sdk-js'

				export const GET = () => new Repsonse(i('hi'))

				export const PATCH = () => json(JSON.stringify({ language }))
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRequestHandlerWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';
			import { json } from '@sveltejs/kit';
			export const GET = initRequestHandlerWrapper().use((_, { i, language }) => new Repsonse(i('hi')));
			export const PATCH = initRequestHandlerWrapper().use((_, { i, language }) => json(JSON.stringify({ language })));"
		`)
	})
})
