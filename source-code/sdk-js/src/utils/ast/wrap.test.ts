import { describe, expect, test } from "vitest"
import { codeToAst, astToCode } from '../../helpers/recast.js';
import { wrapWithPlaceholder } from './wrap.js';

const arrowFunctionAst = codeToAst(`const fn = () => {}`).program.body[0].declarations[0]
const functionAst = codeToAst(`const fn = function() {}`).program.body[0].declarations[0]
const variableDeclaratorAst = codeToAst(`const fn = someFn`).program.body[0].declarations[0]

describe("wrapWithPlaceholder", () => {
	test("arrow function", () => {
		const ast = wrapWithPlaceholder(arrowFunctionAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(() => {})"
		`)
	})

	test("function", () => {
		const ast = wrapWithPlaceholder(functionAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(function() {})"
		`)
	})

	test("variable", () => {
		const ast = wrapWithPlaceholder(variableDeclaratorAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(someFn)"
		`)
	})
})
