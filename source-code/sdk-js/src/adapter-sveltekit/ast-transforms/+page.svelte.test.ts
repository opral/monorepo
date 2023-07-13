import { describe, expect, test } from "vitest"
import { transformPageSvelte } from "./+page.svelte.js"
import { transformSvelte } from "./_.svelte.js"
import { initTransformConfig } from "./test.utils.js"
import { dedent } from "ts-dedent"

describe("transformPageSvelte", () => {
	test("should call transformSvelte", async () => {
		const code = dedent`
			<script>
				import { i } from '@inlang/sdk-js'
				console.log('hello world')
			</script>

			{i('hello')}
		`
		const config = initTransformConfig()
		const transformed = transformPageSvelte("", config, code, true)
		expect(transformed).toBe(transformSvelte("", config, code))
	})
})
