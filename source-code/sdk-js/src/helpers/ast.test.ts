import { types, print } from "recast"
import { dedent } from "ts-dedent"
import { describe, expect, test } from "vitest"
import { getFunctionOrDeclarationValue } from "./ast.js"
import { parseModule } from "magicast"

const b = types.builders
const fallbackFunction = b.arrowFunctionExpression([], b.blockStatement([]))

describe("ast", () => {
	test("getFunctionOrDeclarationValue - fallback arrow function specified", () => {
		const code = dedent``
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load", fallbackFunction)
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {}"
        `)
	})
	test("getFunctionOrDeclarationValue - fallback arrow function not specified", () => {
		const code = dedent``
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {}"
        `)
	})
	test("getFunctionOrDeclarationValue - function", () => {
		const code = dedent`
            export function load() {
                console.log("load")
            }
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "function load() {
                console.log(\\"load\\")
            }"
        `)
	})
	test("getFunctionOrDeclarationValue - arrow function", () => {
		const code = dedent`
            export const load = () => {
                console.log("load")
            }
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {
                console.log(\\"load\\")
            }"
        `)
	})
	test("getFunctionOrDeclarationValue - declaration value", () => {
		const code = dedent`
            const loadFn = function() {
                console.log("load")
            }
            export const load = loadFn
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "loadFn"
        `)
	})
})
