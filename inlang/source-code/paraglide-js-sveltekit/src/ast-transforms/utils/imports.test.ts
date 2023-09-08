import { describe, expect, test } from "vitest"
import {
	addImport,
	findImportDeclarations,
	findNamedImportSpecifier,
	isOptOutImportPresent,
	removeImport,
} from "./imports.js"
import { codeToNode, codeToSourceFile, nodeToCode } from "./js.util.js"
import { Node } from "ts-morph"

describe("removeImport", () => {
	describe("no modifications", () => {
		test("should not fail if node is not a SourceFile", () => {
			const node = codeToNode(`const x = 0`)
			removeImport(node as any, "@inlang/paraglide-js-sveltekit", "i")
		})

		test("should not fail if file is empty", () => {
			const node = codeToSourceFile(``)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot('""')
		})

		test("should not fail if no imports are present", () => {
			const node = codeToSourceFile(`
				const a = 0
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot('"const a = 0;"')
		})

		test("should not fail if import is not found", () => {
			const node = codeToSourceFile(`
				import { get } from 'svelte/store'
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot("\"import { get } from 'svelte/store';\"")
		})

		test("should not remove import with another name from the same package", () => {
			const node = codeToSourceFile(`
				import { languageTags } from '@inlang/paraglide-js-sveltekit'
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot(
				"\"import { languageTags } from '@inlang/paraglide-js-sveltekit';\"",
			)
		})
	})

	describe("modifications", () => {
		test("should remove named import from a package", () => {
			const node = codeToSourceFile(`
				import { i, languageTags } from '@inlang/paraglide-js-sveltekit'
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				"import { languageTags } from '@inlang/paraglide-js-sveltekit';"
			`)
		})

		test("should remove the import completely if no named import is left", () => {
			const node = codeToSourceFile(`
				import { i } from '@inlang/paraglide-js-sveltekit'
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				""
			`)
		})

		test("should remove the import correcltly if multiple imports from the same package are present", () => {
			const node = codeToSourceFile(`
				import { languageTags } from '@inlang/paraglide-js-sveltekit'
				import { i } from '@inlang/paraglide-js-sveltekit'
				import '@inlang/paraglide-js-sveltekit'
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				"import { languageTags } from '@inlang/paraglide-js-sveltekit';
				import '@inlang/paraglide-js-sveltekit';"
			`)
		})

		test("should remove all imports if no names are passed", () => {
			const node = codeToSourceFile(`
				import { i } from '@inlang/paraglide-js-sveltekit'
				import { languageTags, sourceLanguageTag } from '@inlang/paraglide-js-sveltekit'
			`)

			removeImport(node, "@inlang/paraglide-js-sveltekit")

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				""
			`)
		})
	})
})

// ------------------------------------------------------------------------------------------------

describe("addImport", () => {
	test("should not fail if node is not a SourceFile", () => {
		const node = codeToNode(`const x = 0`)
		addImport(node as any, "@inlang/paraglide-js-sveltekit", "i")
	})

	test("should not fail if no names get passed", () => {
		const node = codeToSourceFile(``)
		addImport(node as any, "@inlang/paraglide-js-sveltekit", ...([] as unknown as [""]))
	})

	test("should not add if import is already present", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/paraglide-js-sveltekit'
		`)

		addImport(node, "@inlang/paraglide-js-sveltekit", "i")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			"\"import { i } from '@inlang/paraglide-js-sveltekit';\"",
		)
	})

	test("should add multiple imports", () => {
		const node = codeToSourceFile(``)

		addImport(node, "@inlang/paraglide-js-sveltekit", "i", "languageTag")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			"\"import { i, languageTag } from '@inlang/paraglide-js-sveltekit';\"",
		)
	})

	test("should add multiple imports to existing import", () => {
		const node = codeToSourceFile(`
			import { languageTags } from '@inlang/paraglide-js-sveltekit'
		`)

		addImport(node, "@inlang/paraglide-js-sveltekit", "languageTag", "i")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { languageTags, languageTag, i } from '@inlang/paraglide-js-sveltekit';"
		`)
	})

	test("should add import at the top of the file", () => {
		const node = codeToSourceFile(`
			console.info(1234)

			import './app.css'

		`)

		addImport(node, "@inlang/paraglide-js-sveltekit", "languageTag")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { languageTag } from '@inlang/paraglide-js-sveltekit';
			console.info(1234);
			import './app.css';"
		`)
	})

	test("should also add import if aliased import is already present", () => {
		const node = codeToSourceFile(`
			import { languageTags as langs } from '@inlang/paraglide-js-sveltekit'
		`)

		addImport(node, "@inlang/paraglide-js-sveltekit", "languageTags")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			"\"import { languageTags as langs, languageTags } from '@inlang/paraglide-js-sveltekit';\"",
		)
	})

	test("should create new import statement if type only import is present", () => {
		const node = codeToSourceFile(`
			import type { Hanlde } from '@sveltejs/kit'
		`)

		addImport(node, "@sveltejs/kit", "redirect")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			`
			"import { redirect } from '@sveltejs/kit';
			import type { Hanlde } from '@sveltejs/kit';"
		`,
		)
	})

	test("should check multiple import statements", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/paraglide-js-sveltekit'
			import { languageTags } from '@inlang/paraglide-js-sveltekit'
		`)

		addImport(node, "@inlang/paraglide-js-sveltekit", "languageTags")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { i } from '@inlang/paraglide-js-sveltekit';
			import { languageTags } from '@inlang/paraglide-js-sveltekit';"
		`)
	})

	test("should leave module import intact", () => {
		const node = codeToSourceFile(`
			import '@inlang/paraglide-js-sveltekit'
		`)

		addImport(node, "@inlang/paraglide-js-sveltekit", "i")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { i } from '@inlang/paraglide-js-sveltekit';
			import '@inlang/paraglide-js-sveltekit';"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("findImportDeclarations", () => {
	test("should return an empty array if no import declarations were found", () => {
		const node = codeToSourceFile(``)
		const result = findImportDeclarations(node, "")
		expect(result).toHaveLength(0)
	})

	test("should return an empty array if no import declarations with a given path were found", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/paraglide-js-sveltekit/ignore'
		`)
		const result = findImportDeclarations(node, "@inlang/paraglide-js-sveltekit")
		expect(result).toHaveLength(0)
	})

	test("should return an array containing all import declarations", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/paraglide-js-sveltekit'
			const x = false
			import { languageTags } from '@inlang/paraglide-js-sveltekit'
		`)
		const result = findImportDeclarations(node, "@inlang/paraglide-js-sveltekit")
		expect(result).toHaveLength(2)
	})
})

// ------------------------------------------------------------------------------------------------

describe("findNamedImportSpecifier", () => {
	test("should return undefined if the named import specifier was not found", () => {
		const node = codeToSourceFile(`
			import '@inlang/paraglide-js-sveltekit'
		`)
		const importDeclaration = findImportDeclarations(node, "@inlang/paraglide-js-sveltekit")
		const result = findNamedImportSpecifier(importDeclaration[0]!, "i")
		expect(result).toBeUndefined()
	})

	test("should find a named import specifier if present", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/paraglide-js-sveltekit'
		`)
		const importDeclaration = findImportDeclarations(node, "@inlang/paraglide-js-sveltekit")
		const result = findNamedImportSpecifier(importDeclaration[0]!, "i")
		expect(Node.isImportSpecifier(result)).toBe(true)
	})
})

// ------------------------------------------------------------------------------------------------

describe("isOptOutImportPresent", () => {
	test("should return false if the opt-out import specifier was was not found", () => {
		const node = codeToSourceFile(`
			import '@inlang/paraglide-js-sveltekit'
		`)
		const result = isOptOutImportPresent(node)
		expect(result).toBe(false)
	})

	test("should return false if the opt-out import specifier was was not found", () => {
		const node = codeToSourceFile(`
			import '@inlang/paraglide-js-sveltekit/no-transforms'
		`)
		const result = isOptOutImportPresent(node)
		expect(result).toBe(true)
	})
})
