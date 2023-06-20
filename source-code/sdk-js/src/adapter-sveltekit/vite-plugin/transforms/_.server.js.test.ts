import { describe, expect, test } from 'vitest';
import { transformServerJs } from './_.server.js.js';
import { getTransformConfig } from './test-helpers/config.js';

describe("'@inlang/sdk-js' imports", () => {
	test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
		const code = "import { i } from '@inlang/sdk-js'"
		const config = getTransformConfig()
		expect(() => transformServerJs("", config, code)).toThrow()
	})

	test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
		const code =
			"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
		const config = getTransformConfig()
		expect(() => transformServerJs("", config, code)).not.toThrow()
	})
})