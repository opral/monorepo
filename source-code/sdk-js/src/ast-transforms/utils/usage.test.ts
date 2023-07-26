import { describe, expect, test } from "vitest"
import { codeToSourceFile } from './js.util.js'
import { findAllIdentifiersComingFromAnImport } from './usage.js'
import { dedent } from 'ts-dedent'

describe("findAllIdentifiersComingFromAnImport", () => {
	test("regular usage", () => {
		const code = dedent`
			import { i } from '@inlang/sdk-js'
			i
		`
		const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual('i')
	})

	test("multiple imports", () => {
		const code = dedent`
			import { i } from '@inlang/sdk-js'
			import { languages } from '@inlang/sdk-js'
			import { language } from '@inlang/sdk-js'

			const x = () => u()
			const y = () => language
		`
		const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual('language')
	})

	test("alias", () => {
		const code = dedent`
			import { i as u } from '@inlang/sdk-js'
			const x = () => u('test')
		`
		const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual('u')
	})

	test("ignore other scopes", () => {
		const code = dedent`
			import { i } from '@inlang/sdk-js'

			for (const i of [1, 2, 3]) {
				console.log(i)
			}

			const x = () => console.log(i('test'))
		`
		const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
		expect(identifiers).toHaveLength(1)
		expect(identifiers[0]!.getText()).toEqual('i')
	})

	describe("no false positives", () => {
		test("empty code", () => {
			const code = ""
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})

		test("identifer includes import name", () => {
			const code = dedent`
				import { i } from '@inlang/sdk-js'

				ii('test')
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})

		test("import name includes identifier", () => {
			const code = dedent`
				import { ii } from '@inlang/sdk-js'

				i('test')
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})

		test("for of loop", () => {
			const code = dedent`
				import { i } from '@inlang/sdk-js'

				for (const i of [1, 2, 3]) {
					console.log(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})

		test("for in loop", () => {
			const code = dedent`
				import { i } from '@inlang/sdk-js'

				for (const i in { a: 1, b: 2, c: 3 }) {
					console.log(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})

		test("for loop", () => {
			const code = dedent`
				import { i } from '@inlang/sdk-js'

				for (let i; i < 3; i++) {
					console.log(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})


		test("variable declaration inside function scope", () => {
			const code = dedent`
				import { i } from '@inlang/sdk-js'

				const x = () => {
					let i = 1
					console.log(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})

		test("variable declaration inside block scope", () => {
			const code = dedent`
				import { i } from '@inlang/sdk-js'

				{
					let i = 1
					console.log(i)
				}
			`
			const identifiers = findAllIdentifiersComingFromAnImport(codeToSourceFile(code), '@inlang/sdk-js')
			expect(identifiers).toHaveLength(0)
		})
	})

})
