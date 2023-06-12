import { describe, expect, test } from "vitest"
import { addImport, removeImport } from './imports.js';
import { codeToSourceFile, nodeToCode } from '../utils.js';

describe("removeImport", () => {
	describe("no modifications", () => {
		test("should not fail if file is empty", () => {
			const node = codeToSourceFile(``)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot('""')
		})

		test("should not fail if no imports are present", () => {
			const node = codeToSourceFile(`
				const a = 0
			`)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot(
				'"const a = 0;"'
			)
		})

		test("should not fail if import is not found", () => {
			const node = codeToSourceFile(`
				import { get } from 'svelte/store'
			`)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot(
				'"import { get } from \'svelte/store\';"'
			)
		})

		test("should not remove import with another name from the same package", () => {
			const node = codeToSourceFile(`
				import { languages } from '@inlang/sdk-js'
			`)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot(
				'"import { languages } from \'@inlang/sdk-js\';"'
			)
		})
	})

	describe("modifications", () => {
		test("should remove named import from a package", () => {
			const node = codeToSourceFile(`
				import { i, languages } from '@inlang/sdk-js'
			`)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				"import { languages } from '@inlang/sdk-js';"
			`)
		})

		test("should remove the import completely if no named import is left", () => {
			const node = codeToSourceFile(`
				import { i } from '@inlang/sdk-js'
			`)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				""
			`)
		})

		test("should remove the import correcltly if multiple imports from the same package are present", () => {
			const node = codeToSourceFile(`
				import { languages } from '@inlang/sdk-js'
				import { i } from '@inlang/sdk-js'
				import '@inlang/sdk-js'
			`)

			removeImport(node, '@inlang/sdk-js', 'i')

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				"import { languages } from '@inlang/sdk-js';
				import '@inlang/sdk-js';"
			`)
		})

		test("should remove all imports if no names are passed", () => {
			const node = codeToSourceFile(`
				import { i } from '@inlang/sdk-js'
				import { languages, referenceLanguage } from '@inlang/sdk-js'
			`)

			removeImport(node, '@inlang/sdk-js')

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				""
			`)
		})
	})
})

// ------------------------------------------------------------------------------------------------

describe("addImport", () => {
	test("should not add if import is already present", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/sdk-js'
		`)

		addImport(node, '@inlang/sdk-js', 'i')

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			'"import { i } from \'@inlang/sdk-js\';"'
		)
	})

	test("should add multiple imports", () => {
		const node = codeToSourceFile(``)

		addImport(node, '@inlang/sdk-js', 'i', 'language')

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			'"import { i, language } from \'@inlang/sdk-js\';"'
		)
	})

	test("should add multiple imports to existing import", () => {
		const node = codeToSourceFile(`
			import { languages } from '@inlang/sdk-js'
		`)

		addImport(node, '@inlang/sdk-js', 'language', 'i')

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { languages, language, i } from '@inlang/sdk-js';"
		`)
	})

	test("should add import at the top of the file", () => {
		const node = codeToSourceFile(`
			console.info(1234)

			import './app.css'

		`)

		addImport(node, '@inlang/sdk-js', 'language')

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { language } from '@inlang/sdk-js';
			console.info(1234);
			import './app.css';"
		`)
	})

	test("should also add import if aliased import is already present", () => {
		const node = codeToSourceFile(`
			import { languages as langs } from '@inlang/sdk-js'
		`)

		addImport(node, '@inlang/sdk-js', 'languages')

		expect(nodeToCode(node)).toMatchInlineSnapshot('"import { languages as langs, languages } from \'@inlang/sdk-js\';"')
	})

	test("should leave module import intact", () => {
		const node = codeToSourceFile(`
			import '@inlang/sdk-js'
		`)

		addImport(node, '@inlang/sdk-js', 'i')

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { i } from '@inlang/sdk-js';
			import '@inlang/sdk-js';"
		`)
	})
})
