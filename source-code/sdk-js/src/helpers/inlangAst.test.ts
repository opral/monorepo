import { parseModule } from "magicast"
import { dedent } from "ts-dedent"
import { describe, expect, test } from "vitest"
import { rewriteLoadOrHandleParameters } from "./inlangAst.js"
import { print, types } from "recast"

const n = types.namedTypes

describe("rewriteLoadOrHandleParameters", () => {
	test("Throw error for an illegal function", () => {
		const code = dedent`function load(parameter1, parameter2) {}`
		const expression = parseModule(code)

		expect(() =>
			rewriteLoadOrHandleParameters(
				(expression.$ast as types.namedTypes.Program)
					.body[0] as unknown as types.namedTypes.ArrowFunctionExpression,
			),
		).toThrowError()
	})
	test("Keep first parameter while not adding second parameter if no import is used", () => {
		const code = dedent`function load(parameter1) {}`
		const expression = parseModule(code)
		rewriteLoadOrHandleParameters(
			(expression.$ast as types.namedTypes.Program)
				.body[0] as unknown as types.namedTypes.ArrowFunctionExpression,
			[
				["i", "iAlias"],
				["language", "language"],
			],
		)
		const result = print(expression.$ast).code
		expect(result).toMatchInlineSnapshot(`
            "function load(parameter1) {}"
        `)
	})
	test("Keep first parameter while adding the used imports as second parameter", () => {
		const code = dedent`
            function load(parameter1) {
                console.log(iAlias)
                console.log(language)
            }
        `
		const expression = parseModule(code)
		rewriteLoadOrHandleParameters(
			(expression.$ast as types.namedTypes.Program)
				.body[0] as unknown as types.namedTypes.ArrowFunctionExpression,
			[
				["i", "iAlias"],
				["language", "language"],
			],
		)
		const result = print(expression.$ast).code
		expect(result).toMatchInlineSnapshot(`
            "function load(
                parameter1,
                {
                    i: iAlias,
                    language: language
                }
            ) {
                console.log(iAlias)
                console.log(language)
            }"
        `)
	})
	test("Add empty first parameter while adding the used imports as second parameter", () => {
		const code = dedent`
            function load() {
                console.log(iAlias)
                console.log(language)
            }
        `
		const expression = parseModule(code)
		rewriteLoadOrHandleParameters(
			(expression.$ast as types.namedTypes.Program)
				.body[0] as unknown as types.namedTypes.ArrowFunctionExpression,
			[
				["i", "iAlias"],
				["language", "language"],
			],
		)
		const result = print(expression.$ast).code
		expect(result).toMatchInlineSnapshot(`
            "function load(
                _,
                {
                    i: iAlias,
                    language: language
                }
            ) {
                console.log(iAlias)
                console.log(language)
            }"
        `)
	})
})
describe("extractWrappableExpression", () => {
	test("Dont touch non-functions", () => {
		const code = dedent`
            const fn = () => {}
            export const load = fn
        `
	})
})
