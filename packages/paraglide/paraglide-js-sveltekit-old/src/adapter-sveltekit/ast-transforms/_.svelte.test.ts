import { describe, test, expect } from "vitest"
import { transformSvelte } from "./_.svelte.js"
import dedent from "dedent"
import { initTestApp } from "./test.utils.js"

describe("transformSvelte", () => {
	describe("empty file", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTestApp()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toEqual(code)
		})
	})

	describe("'@inlang/paraglide-js-sveltekit' imports", () => {
		test("should transform imports", () => {
			const code = dedent`
				<script>
					import { i } from "@inlang/paraglide-js-sveltekit"
				</script>

				<h1>{i('hello')}</h1>
			`
			const config = initTestApp()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				const { i } = getRuntimeFromContext();
				</script>

				<h1>{i('hello')}</h1>"
			`)
		})

		test("should resolve aliases", () => {
			const code = dedent`
				<script>
					import { i as u } from "@inlang/paraglide-js-sveltekit"
				</script>
			`
			const config = initTestApp()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				const { i: u } = getRuntimeFromContext();
				</script>"
			`)
		})

		test("should support multiple imports", () => {
			const code = dedent`
				<script>
					import { i as u } from "@inlang/paraglide-js-sveltekit"
					import { languageTags, i } from "@inlang/paraglide-js-sveltekit"
				</script>
			`
			const config = initTestApp()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script>
					import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				const { i: u, languageTags, i } = getRuntimeFromContext();
				</script>"
			`)
		})

		test("should work on module script", () => {
			const code = dedent`
				<script context="module">
					import { i as u } from "@inlang/paraglide-js-sveltekit"
					import { languageTags, i } from "@inlang/paraglide-js-sveltekit"
				</script>
			`
			const config = initTestApp()
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script context=\\"module\\">
					import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive-workaround';
				const { i: u, languageTags, i } = getRuntimeFromContext();
				</script>"
			`)
		})

		test("languageInUrl", () => {
			const code = dedent`
				<script context="module">
					import { i as u } from "@inlang/paraglide-js-sveltekit"
					import { languageTags, i } from "@inlang/paraglide-js-sveltekit"
				</script>
			`
			const config = initTestApp({ options: { languageInUrl: true } })
			const transformed = transformSvelte("", config, code)
			expect(transformed).toMatchInlineSnapshot(`
				"<script context=\\"module\\">
					import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive';
				const { i: u, languageTags, i } = getRuntimeFromContext();
				</script>"
			`)
		})
	})

	test("should not do anything if '@inlang/paraglide-js-sveltekit/no-transforms' import is detected", () => {
		const code = dedent`
			<script>
				import '@inlang/paraglide-js-sveltekit/no-transforms'
			</script>

			<h1>hello</h1>
		`
		const config = initTestApp()
		const transformed = transformSvelte("", config, code)
		expect(transformed).toEqual(code)
	})

	test.todo("should not generate duplicated import and variable declaration", () => {
		const code = dedent`
			<script context="module">
				import { languageTags } from "@inlang/paraglide-js-sveltekit"
			</script>
			<script>
				import { i } from "@inlang/paraglide-js-sveltekit"
			</script>
		`
		const config = initTestApp()
		const transformed = transformSvelte("", config, code)
		expect(transformed).toMatchInlineSnapshot(`
			"<script context=\\"module\\">
				import { getRuntimeFromContext } from '@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive';
			const { languageTags, i } = getRuntimeFromContext();
			</script>
			<script>
			</script>"
		`)
	})
})
