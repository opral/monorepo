import { describe, expect, test } from "vitest"
import { addImport, removeImport } from './imports.js';
import { codeToAst, astToCode } from '../recast.js';

describe("removeImport", () => {
	describe("no modifications", () => {
		test("should not fail if file is empty", () => {
			const ast = codeToAst(``)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot('""')
		})

		test("should not fail if no imports are present", () => {
			const ast = codeToAst(`
				const a = 0
			`)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				"const a = 0"
			`)
		})

		test("should not fail if import is not found", () => {
			const ast = codeToAst(`
				import { get } from 'svelte/store'
			`)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				"import { get } from 'svelte/store'"
			`)
		})

		test("should not remove import with another name from the same package", () => {
			const ast = codeToAst(`
				import { languages } from '@inlang/sdk-js'
			`)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				"import { languages } from '@inlang/sdk-js'"
			`)
		})
	})

	describe("modifications", () => {
		test("should remove named import from a package", () => {
			const ast = codeToAst(`
				import { i, languages } from '@inlang/sdk-js'
			`)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				"import { languages } from '@inlang/sdk-js';"
			`)
		})

		test("should remove the import completely if no named import is left", () => {
			const ast = codeToAst(`
				import { i } from '@inlang/sdk-js'
			`)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				""
			`)
		})

		test("should remove the import correcltly if multiple imports from the same package are present", () => {
			const ast = codeToAst(`
				import { languages } from '@inlang/sdk-js'
				import { i } from '@inlang/sdk-js'
				import '@inlang/sdk-js'
			`)

			removeImport(ast, '@inlang/sdk-js', 'i')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				"import { languages } from '@inlang/sdk-js'
				import '@inlang/sdk-js'"
			`)
		})

		test("should remove all imports if no names are passed", () => {
			const ast = codeToAst(`
				import { i } from '@inlang/sdk-js'
				import { languages, referenceLanguage } from '@inlang/sdk-js'
			`)

			removeImport(ast, '@inlang/sdk-js')

			expect(astToCode(ast)).toMatchInlineSnapshot(`
				""
			`)
		})
	})
})

// ------------------------------------------------------------------------------------------------

describe("addImport", () => {
	test("should not add if import is already present", () => {
		const ast = codeToAst(`
			import { i } from '@inlang/sdk-js'
		`)

		addImport(ast, '@inlang/sdk-js', 'i')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"import { i } from '@inlang/sdk-js'"
		`)
	})

	test("should add multiple imports", () => {
		const ast = codeToAst(``)

		addImport(ast, '@inlang/sdk-js', 'i', 'language')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"import { i, language } from \\"@inlang/sdk-js\\";"
		`)
	})

	test("should add multiple imports to existing import", () => {
		const ast = codeToAst(`
			import { languages } from '@inlang/sdk-js'
		`)

		addImport(ast, '@inlang/sdk-js', 'language', 'i')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"import { languages, language, i } from '@inlang/sdk-js';"
		`)
	})

	test("should add import at the top of the file", () => {
		const ast = codeToAst(`
			console.log(1234)

			import './app.css'

		`)

		addImport(ast, '@inlang/sdk-js', 'language')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"import { language } from \\"@inlang/sdk-js\\";
			console.log(1234)

			import './app.css'
			"
		`)
	})

	test("should also add import if aliased import is already present", () => {
		const ast = codeToAst(`
			import { languages as langs } from '@inlang/sdk-js'
		`)

		addImport(ast, '@inlang/sdk-js', 'languages')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"import { languages as langs, languages } from '@inlang/sdk-js';"
		`)
	})

	test("should leave module import intact", () => {
		const ast = codeToAst(`
			import '@inlang/sdk-js'
		`)

		addImport(ast, '@inlang/sdk-js', 'i')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"import { i } from \\"@inlang/sdk-js\\";
			import '@inlang/sdk-js'"
		`)
	})
})
