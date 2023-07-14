import { describe, test, expect } from "vitest"
import { transformSvelte } from "./_.svelte.js"
import { dedent } from "ts-dedent"
import { initTransformConfig } from "./test.utils.js"

describe("transformSvelte", () => {
	describe("empty file", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTransformConfig()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toEqual(code)
		})
	})

	describe("'@inlang/sdk-js' imports", () => {
		test("should transform imports", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/sdk-js"
				</script>

				<h1>{i('hello')}</h1>
			`
			const config = initTransformConfig()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				const { i } = getRuntimeFromContext();
				</script>

				<h1>{i('hello')}</h1>"
			`)
		})

		test("should resolve aliases", () => {
			const code = dedent`
				<script>
					import { i as u } from "@inlang/sdk-js"
				</script>
			`
			const config = initTransformConfig()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				const { i: u } = getRuntimeFromContext();
				</script>"
			`)
		})

		test("should support multiple imports", () => {
			const code = dedent`
				<script>
					import { i as u } from "@inlang/sdk-js"
					import { languages, i } from "@inlang/sdk-js"
				</script>
			`
			const config = initTransformConfig()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				const { i: u, languages, i } = getRuntimeFromContext();
				</script>"
			`)
		})

		test("should work on module script", () => {
			const code = dedent`
				<script context="module">
					import { i as u } from "@inlang/sdk-js"
					import { languages, i } from "@inlang/sdk-js"
				</script>
			`
			const config = initTransformConfig()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script context=\\"module\\">
					import { getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/reactive-workaround';
				const { i: u, languages, i } = getRuntimeFromContext();
				</script>"
			`)
		})

		test("languageInUrl", () => {
			const code = dedent`
				<script context="module">
					import { i as u } from "@inlang/sdk-js"
					import { languages, i } from "@inlang/sdk-js"
				</script>
			`
			const config = initTransformConfig({ languageInUrl: true })
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script context=\\"module\\">
					import { getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
				const { i: u, languages, i } = getRuntimeFromContext();
				</script>"
			`)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = dedent`
			<script>
				import '@inlang/sdk-js/no-transforms'
			</script>

			<h1>hello</h1>
		`
		const config = initTransformConfig()
		const transformed = transformSvelte("", config, code)
		expect(transformed).toEqual(code)
	})

	test.todo("should not generate duplicated import and variable declaration", () => {
		const code = dedent`
			<script context="module">
				import { languages } from "@inlang/sdk-js"
			</script>
			<script>
				import { i } from "@inlang/sdk-js"
			</script>
		`
		const config = initTransformConfig()
		const transformed = transformSvelte("", config, code)
		expect(transformed).toMatchInlineSnapshot(`
			"<script context=\\"module\\">
				import { getRuntimeFromContext } from '@inlang/sdk-js/adapter-sveltekit/client/not-reactive';
			const { languages, i } = getRuntimeFromContext();
			</script>
			<script>
			</script>"
		`)
	})
})
