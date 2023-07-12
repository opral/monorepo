import { describe, expect, test } from "vitest"
import {
	addImport,
	findImportDeclarations,
	findNamedImportSpecifier,
	isOptOutImportPresent,
	removeImport,
} from "./imports.js"
import { codeToNode, codeToSourceFile, nodeToCode } from "../utils.js"
import { Node } from "ts-morph"

describe("removeImport", () => {
	describe("no modifications", () => {
		test("should not fail if node is not a SourceFile", () => {
			const node = codeToNode(`const x = 0`)
			removeImport(node as any, "@inlang/sdk-js", "i")
		})

		test("should not fail if file is empty", () => {
			const node = codeToSourceFile(``)

			removeImport(node, "@inlang/sdk-js", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot('""')
		})

		test("should not fail if no imports are present", () => {
			const node = codeToSourceFile(`
				const a = 0
			`)

			removeImport(node, "@inlang/sdk-js", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot('"const a = 0;"')
		})

		test("should not fail if import is not found", () => {
			const node = codeToSourceFile(`
				import { get } from 'svelte/store'
			`)

			removeImport(node, "@inlang/sdk-js", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot("\"import { get } from 'svelte/store';\"")
		})

		test("should not remove import with another name from the same package", () => {
			const node = codeToSourceFile(`
				import { languages } from '@inlang/sdk-js'
			`)

			removeImport(node, "@inlang/sdk-js", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot(
				"\"import { languages } from '@inlang/sdk-js';\"",
			)
		})
	})

	describe("modifications", () => {
		test("should remove named import from a package", () => {
			const node = codeToSourceFile(`
				import { i, languages } from '@inlang/sdk-js'
			`)

			removeImport(node, "@inlang/sdk-js", "i")

			expect(nodeToCode(node)).toMatchInlineSnapshot(`
				"import { languages } from '@inlang/sdk-js';"
			`)
		})

		test("should remove the import completely if no named import is left", () => {
			const node = codeToSourceFile(`
				import { i } from '@inlang/sdk-js'
			`)

			removeImport(node, "@inlang/sdk-js", "i")

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

			removeImport(node, "@inlang/sdk-js", "i")

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

			removeImport(node, "@inlang/sdk-js")

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
		addImport(node as any, "@inlang/sdk-js", "i")
	})

	test("should not fail if no names get passed", () => {
		const node = codeToSourceFile(``)
		addImport(node as any, "@inlang/sdk-js", ...([] as unknown as [""]))
	})

	test("should not add if import is already present", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/sdk-js'
		`)

		addImport(node, "@inlang/sdk-js", "i")

		expect(nodeToCode(node)).toMatchInlineSnapshot("\"import { i } from '@inlang/sdk-js';\"")
	})

	test("should add multiple imports", () => {
		const node = codeToSourceFile(``)

		addImport(node, "@inlang/sdk-js", "i", "language")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			"\"import { i, language } from '@inlang/sdk-js';\"",
		)
	})

	test("should add multiple imports to existing import", () => {
		const node = codeToSourceFile(`
			import { languages } from '@inlang/sdk-js'
		`)

		addImport(node, "@inlang/sdk-js", "language", "i")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { languages, language, i } from '@inlang/sdk-js';"
		`)
	})

	test("should add import at the top of the file", () => {
		const node = codeToSourceFile(`
			console.info(1234)

			import './app.css'

		`)

		addImport(node, "@inlang/sdk-js", "language")

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

		addImport(node, "@inlang/sdk-js", "languages")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			"\"import { languages as langs, languages } from '@inlang/sdk-js';\"",
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
			import { i } from '@inlang/sdk-js'
			import { languages } from '@inlang/sdk-js'
		`)

		addImport(node, "@inlang/sdk-js", "languages")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { i } from '@inlang/sdk-js';
			import { languages } from '@inlang/sdk-js';"
		`)
	})

	test("should leave module import intact", () => {
		const node = codeToSourceFile(`
			import '@inlang/sdk-js'
		`)

		addImport(node, "@inlang/sdk-js", "i")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import { i } from '@inlang/sdk-js';
			import '@inlang/sdk-js';"
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
			import { i } from '@inlang/sdk-js/ignore'
		`)
		const result = findImportDeclarations(node, "@inlang/sdk-js")
		expect(result).toHaveLength(0)
	})

	test("should return an array containing all import declarations", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/sdk-js'
			const x = false
			import { languages } from '@inlang/sdk-js'
		`)
		const result = findImportDeclarations(node, "@inlang/sdk-js")
		expect(result).toHaveLength(2)
	})
})

// ------------------------------------------------------------------------------------------------

describe("findNamedImportSpecifier", () => {
	test("should return undefined if the named import specifier was not found", () => {
		const node = codeToSourceFile(`
			import '@inlang/sdk-js'
		`)
		const importDeclaration = findImportDeclarations(node, "@inlang/sdk-js")
		const result = findNamedImportSpecifier(importDeclaration[0]!, "i")
		expect(result).toBeUndefined()
	})

	test("should find a named import specifier if present", () => {
		const node = codeToSourceFile(`
			import { i } from '@inlang/sdk-js'
		`)
		const importDeclaration = findImportDeclarations(node, "@inlang/sdk-js")
		const result = findNamedImportSpecifier(importDeclaration[0]!, "i")
		expect(Node.isImportSpecifier(result)).toBe(true)
	})
})

// ------------------------------------------------------------------------------------------------

describe("isOptOutImportPresent", () => {
	test("should return false if the opt-out import specifier was was not found", () => {
		const node = codeToSourceFile(`
			import '@inlang/sdk-js'
		`)
		const result = isOptOutImportPresent(node)
		expect(result).toBe(false)
	})

	test("should return false if the opt-out import specifier was was not found", () => {
		const node = codeToSourceFile(`
			import '@inlang/sdk-js/no-transforms'
		`)
		const result = isOptOutImportPresent(node)
		expect(result).toBe(true)
	})
})
