import { describe, expect, test } from "vitest"
import { transformJs } from "./_.js.js"
import { initTestApp } from "./test.utils.js"
import dedent from "dedent"

describe("transformJs", () => {
	test("should not do anything if no SDK import is found", () => {
		const code = "export const fn = () => 'hi'"
		const config = initTestApp()
		const transformed = transformJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = "import '@inlang/paraglide-js-sveltekit/no-transforms'"
		const config = initTestApp()
		const transformed = transformJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/paraglide-js-sveltekit' imports correctly", () => {
		const transformed = transformJs(
			"",
			initTestApp(),
			dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				export const test = () => console.info(i('hi'))
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { getRuntimeFromGlobalThis } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/shared';
			export const test = () => console.info(getRuntimeFromGlobalThis().i('hi'));"
		`)
	})

	test("should throw an error if SDK import get's used outside of a function scope", () => {
		expect(() =>
			transformJs(
				"/test.js",
				initTestApp(),
				dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				i()
			`,
			),
		).toThrow()
	})
})
