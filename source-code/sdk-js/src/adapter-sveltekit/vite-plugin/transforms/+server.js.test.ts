import { describe, expect, test } from "vitest"
import { getTransformConfig } from "./test-helpers/config.js"
import { transformServerRequestJs } from './+server.js.js'

// TODO: create test matrix for all possible combinations

describe("transformServerRequestJs", () => {
	test("should not do anything (for now)", () => {
		const code = ""
		const config = getTransformConfig()
		const transformed = transformServerRequestJs("", config, code, false)
		expect(transformed).toEqual(code)
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = getTransformConfig()
		const transformed = transformServerRequestJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	describe("'@inlang/sdk-js' imports", () => {
		test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
			const code = "import { i } from '@inlang/sdk-js'"
			const config = getTransformConfig()
			expect(() => transformServerRequestJs("", config, code, true)).toThrow()
		})

		test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
			const code =
				"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
			const config = getTransformConfig()
			expect(() => transformServerRequestJs("", config, code, true)).not.toThrow()
		})
	})
})
