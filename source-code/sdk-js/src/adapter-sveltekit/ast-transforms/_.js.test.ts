import { describe, expect, test } from "vitest"
import { transformJs } from "./_.js.js"
import { initTransformConfig } from "./test.utils.js"
import { dedent } from "ts-dedent"

describe("transformJs", () => {
	test("should not do anything if no SDK import is found", () => {
		const code = "export const fn = () => 'hi'"
		const config = initTransformConfig()
		const transformed = transformJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformJs("", config, code)
		expect(transformed).toEqual(code)
	})

	test("should transform '@inlang/sdk-js' imports correctly", () => {
		const transformed = transformJs(
			"",
			initTransformConfig(),
			dedent`
				import { i } from '@inlang/sdk-js'

				export const test = () => console.info(i('hi'))
			`,
		)

		expect(transformed).toMatchInlineSnapshot(`
			"import { getRuntimeFromGlobalThis } from '@inlang/sdk-js/adapter-sveltekit/client/shared';
			export const test = () => console.info(getRuntimeFromGlobalThis().i('hi'));"
		`)
	})

	test("should throw an error if SDK import get's used outside of a function scope", () => {
		expect(() =>
			transformJs(
				"/test.js",
				initTransformConfig(),
				dedent`
				import { i } from '@inlang/sdk-js'

				i()
			`,
			),
		).toThrow()
	})
})
