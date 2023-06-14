import { dedent } from 'ts-dedent'
import { describe, test, expect } from "vitest"
import { getSvelteFileParts } from './svelte.util.js'

describe("getSvelteFileParts", () => {
	test('should split script, markup and style blocks', () => {
		const code = dedent`
			<svelte:options />

			<script context="module">
				import * from 'foo'
			</script>

			<script lang="ts">
				console.log('hello world')
			</script>

			<h1 class="heading">
				Hello World
			</h1>

			<style>
				h1 {
					color: red;
				}
			</style>
			`
		const result = getSvelteFileParts(code)

		expect(result.toString()).toEqual(code)
		expect(result.moduleScript).toMatchInlineSnapshot(`
			"
				import * from 'foo'
			"
		`)
		expect(result.script).toMatchInlineSnapshot(`
			"
				console.log('hello world')
			"
		`)
		expect(result.markup).toMatchInlineSnapshot(`
			"<svelte:options />

			$_INLANG_MODULE_SCRIPT_PLACEHOLDER_$

			$_INLANG_SCRIPT_PLACEHOLDER_$

			<h1 class=\\"heading\\">
				Hello World
			</h1>

			$_INLANG_STYLE_PLACEHOLDER_$"
		`)
	})

	describe('should return undefined if blocks are missing', () => {
		test('empty file', () => {
			const code = ""
			const result = getSvelteFileParts(code)

			expect(result.toString()).toEqual(code)
			expect(result.moduleScript).toBeUndefined()
			expect(result.script).toBeUndefined()
			expect(result.markup).toMatchInlineSnapshot('""')
		})

		test('just html', () => {
			const code = "<h1>test</h1>"
			const result = getSvelteFileParts(code)

			expect(result.toString()).toEqual(code)
			expect(result.moduleScript).toBeUndefined()
			expect(result.script).toBeUndefined()
			expect(result.markup).toMatchInlineSnapshot('"<h1>test</h1>"')
		})

		test('just script tag', () => {
			const code = "<script>console.log('test')</script>"
			const result = getSvelteFileParts(code)

			expect(result.toString()).toEqual(code)
			expect(result.moduleScript).toBeUndefined()
			expect(result.script).toMatchInlineSnapshot('"console.log(\'test\')"')
			expect(result.markup).toMatchInlineSnapshot('"$_INLANG_SCRIPT_PLACEHOLDER_$"')
		})

		test('just module script tag', () => {
			const code = `<script context="module">console.log('test')</script>`
			const result = getSvelteFileParts(code)

			expect(result.toString()).toEqual(code)
			expect(result.moduleScript).toMatchInlineSnapshot('"console.log(\'test\')"')
			expect(result.script).toBeUndefined()
			expect(result.markup).toMatchInlineSnapshot('"$_INLANG_MODULE_SCRIPT_PLACEHOLDER_$"')
		})

		test('just style tag', () => {
			const code = `<style lang="scss" global>h1 { color: red; }</style>`
			const result = getSvelteFileParts(code)

			expect(result.toString()).toEqual(code)
			expect(result.moduleScript).toBeUndefined()
			expect(result.script).toBeUndefined()
			expect(result.markup).toMatchInlineSnapshot('"$_INLANG_STYLE_PLACEHOLDER_$"')
		})
	})

	describe('alter specific parts of code', () => {
		describe('add', () => {
			test('should add a module script', () => {
				const code = ""
				const result = getSvelteFileParts(code)

				result.moduleScript = "console.log('hello module')"

				expect(result.toString()).toMatchInlineSnapshot(`
					"<script context=\\"module\\">
					console.log('hello module')
					</script>"
				`)
			})

			test('should add a script', () => {
				const code = ""
				const result = getSvelteFileParts(code)

				result.script = "console.log('hello world')"

				expect(result.toString()).toMatchInlineSnapshot(`
					"<script>
					console.log('hello world')
					</script>"
				`)
			})

			test('should add a markup', () => {
				const code = ""
				const result = getSvelteFileParts(code)

				result.markup = "<slot/>"

				expect(result.toString()).toMatchInlineSnapshot('"<slot/>"')
			})
		})

		describe('remove', () => {
			test('should remove a module script', () => {
				const code = dedent`
					<script context="module">
						import * from 'foo'
					</script>`
				const result = getSvelteFileParts(code)

				result.moduleScript = ""

				expect(result.toString()).toMatchInlineSnapshot('""')
			})

			test('should add a script', () => {
				const code = dedent`
					<script>
						console.log('hello world')
					</script>`
				const result = getSvelteFileParts(code)

				result.script = ""

				expect(result.toString()).toMatchInlineSnapshot('""')
			})

			test('should add a markup', () => {
				const code = "<slot/>"
				const result = getSvelteFileParts(code)

				result.markup = ""

				expect(result.toString()).toMatchInlineSnapshot('""')
			})
		})
	})
})
