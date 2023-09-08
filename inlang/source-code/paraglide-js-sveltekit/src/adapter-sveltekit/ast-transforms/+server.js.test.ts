import { describe, expect, test } from "vitest"
import { initTestApp } from "./test.utils.js"
import { transformServerRequestJs } from "./+server.js.js"
import dedent from "dedent"

// TODO: create test matrix for all possible combinations

describe("transformServerRequestJs", () => {
	test("should not do anything if no SDK import is found", () => {
		const code = "export const GET = () => new Repsonse('hi')"
		const config = initTestApp()
		const transformed = transformServerRequestJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = "import '@inlang/paraglide-js-sveltekit/no-transforms'"
		const config = initTestApp()
		const transformed = transformServerRequestJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformServerRequestJs(
			"",
			initTestApp(),
			dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				export const GET = () => new Repsonse(i('hi'))
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRequestHandlerWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
			export const GET = initRequestHandlerWrapper().use((_, { i }) => new Repsonse(i('hi')));"
		`)
	})

	test("should transform function declaration to function expression", () => {
		const transformed = transformServerRequestJs(
			"",
			initTestApp(),
			dedent`
				import { languages } from '@inlang/paraglide-js-sveltekit'

				export async function POST() {
					return { languages }
				}
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRequestHandlerWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
			export const POST = initRequestHandlerWrapper().use(async function POST(_, { languages }) {
			    return { languages };
			});"
		`)
	})

	test("should transform multiple '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformServerRequestJs(
			"",
			initTestApp(),
			dedent`
				import { json } from '@sveltejs/kit'
				import { i, language } from '@inlang/paraglide-js-sveltekit'

				export const GET = () => new Repsonse(i('hi'))

				export const PATCH = () => json(JSON.stringify({ language }))
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { initRequestHandlerWrapper } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/server';
			import { json } from '@sveltejs/kit';
			export const GET = initRequestHandlerWrapper().use((_, { i, language }) => new Repsonse(i('hi')));
			export const PATCH = initRequestHandlerWrapper().use((_, { i, language }) => json(JSON.stringify({ language })));"
		`)
	})
})
