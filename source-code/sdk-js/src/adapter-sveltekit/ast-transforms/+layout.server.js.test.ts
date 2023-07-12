import { dedent } from "ts-dedent"
import { describe, expect, test } from "vitest"
import { transformLayoutServerJs } from './+layout.server.js.js'
import { initTransformConfig } from './test.utils.js'

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

	describe("'@inlang/sdk-js' imports", () => {
		test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
			const code = "import { i } from '@inlang/sdk-js'"
			const config = initTransformConfig()
			expect(() => transformLayoutServerJs("", config, code, true)).toThrow()
		})

		test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
			const code =
				"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
			const config = initTransformConfig()
			expect(() => transformLayoutServerJs("", config, code, true)).not.toThrow()
		})
	})
})
