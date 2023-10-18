import { describe, expect, test } from "vitest"
import { codeToSourceFile } from "./js.util.js"
import { findAllIdentifiersComingFromAnImport } from "./usage.js"
import dedent from "dedent"

describe("findAllIdentifiersComingFromAnImport", () => {
	test("regular usage", () => {
		const code = dedent`
			import { i } from '@inlang/paraglide-js-sveltekit'
			i
		`
		const identifiers = findAllIdentifiersComingFromAnImport(
			codeToSourceFile(code),
			"@inlang/paraglide-js-sveltekit",
		)
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual("i")
	})

	test("multiple imports", () => {
		const code = dedent`
			import { i } from '@inlang/paraglide-js-sveltekit'
			import { languages } from '@inlang/paraglide-js-sveltekit'
			import { language } from '@inlang/paraglide-js-sveltekit'

			const x = () => u()
			const y = () => language
		`
		const identifiers = findAllIdentifiersComingFromAnImport(
			codeToSourceFile(code),
			"@inlang/paraglide-js-sveltekit",
		)
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual("language")
	})

	test("alias", () => {
		const code = dedent`
			import { i as u } from '@inlang/paraglide-js-sveltekit'
			const x = () => u('test')
		`
		const identifiers = findAllIdentifiersComingFromAnImport(
			codeToSourceFile(code),
			"@inlang/paraglide-js-sveltekit",
		)
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual("u")
	})

	test("ignore other scopes", () => {
		const code = dedent`
			import { i } from '@inlang/paraglide-js-sveltekit'

			for (const i of [1, 2, 3]) {
				console.info(i)
			}

			const x = () => console.info(i('test'))
		`
		const identifiers = findAllIdentifiersComingFromAnImport(
			codeToSourceFile(code),
			"@inlang/paraglide-js-sveltekit",
		)
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual("i")
	})

	describe("no false positives", () => {
		test("empty code", () => {
			const code = ""
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("identifer includes import name", () => {
			const code = dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				ii('test')
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("import name includes identifier", () => {
			const code = dedent`
				import { ii } from '@inlang/paraglide-js-sveltekit'

				i('test')
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("for of loop", () => {
			const code = dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				for (const i of [1, 2, 3]) {
					console.info(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("for in loop", () => {
			const code = dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				for (const i in { a: 1, b: 2, c: 3 }) {
					console.info(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("for loop", () => {
			const code = dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				for (let i; i < 3; i++) {
					console.info(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("variable declaration inside function scope", () => {
			const code = dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				const x = () => {
					let i = 1
					console.info(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})

		test("variable declaration inside block scope", () => {
			const code = dedent`
				import { i } from '@inlang/paraglide-js-sveltekit'

				{
					let i = 1
					console.info(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(
				codeToSourceFile(code),
				"@inlang/paraglide-js-sveltekit",
			)
			expect(identifiers).toHaveLength(0)
		})
	})
})
