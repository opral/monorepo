import { describe, expect, test } from "vitest"
import { transformJs } from "./_.js.js"
import { initTransformConfig } from "./test.utils.js"

describe("'@inlang/sdk-js' imports", () => {
	test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
		const code = "import { i } from '@inlang/sdk-js'"
		const config = initTransformConfig()
		expect(() => transformJs("", config, code)).toThrow()
	})

	test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
		const code = "import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
		const config = initTransformConfig()
		expect(() => transformJs("", config, code)).not.toThrow()
	})
})
