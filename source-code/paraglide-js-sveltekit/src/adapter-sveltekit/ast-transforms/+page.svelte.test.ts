import { describe, expect, test } from "vitest"
import { transformPageSvelte } from "./+page.svelte.js"
import { transformSvelte } from "./_.svelte.js"
import { initTestApp } from "./test.utils.js"
import dedent from "dedent"

describe("transformPageSvelte", () => {
	test("should call transformSvelte", async () => {
		const code = dedent`
			<script>
				import { i } from '@inlang/paraglide-js-sveltekit'
				console.info('hello world')
			</script>

			{i('hello')}
		`
		const config = initTestApp()
		const transformed = transformPageSvelte("", config, code, true)
		expect(transformed).toBe(transformSvelte("", config, code))
	})
})
