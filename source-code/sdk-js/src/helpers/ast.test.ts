import { describe, expect, test } from "vitest"
import { parse } from "acorn"
import { wrapVariableDeclaration } from "./ast.js"
// @ts-ignore
import { generate } from "astring"
import type { Program } from "estree"
import type { Options } from "acorn"

//@ivanhofer - is ecmaVersion 2020 correct here?
const acornOptions = {
	ecmaVersion: 2020,
	sourceType: "module",
} as Options

describe("ast - wrapVariableDeclaration", () => {
	test("Wraps a simple arrow function declaration", () => {
		const input = `
            export const load = () => {
                return { data: true }
            }
        `
		const expected = `
            export const load = wrapFn(() => {
                return { data: true }
            })
        `
		// @ivanohofer - what do you think of the type casting below?
		const inputAst = parse(input, acornOptions) as unknown as Program
		const resultAst = wrapVariableDeclaration(inputAst, "load", "wrapFn")
		const expectedAst = parse(expected, acornOptions) as unknown as Program
		const expectedCode = generate(expectedAst)
		const resultCode = generate(resultAst)
		expect(resultCode).toEqual(expectedCode)
	})
})
