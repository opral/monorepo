import { describe, expect, test } from "vitest"
import { astToCode, codeToDeclarationAst } from '../../helpers/recast.js';
import { wrapWithPlaceholder } from './wrap.js';

describe("wrapWithPlaceholder", () => {
	test("arrow function", () => {
		let ast = codeToDeclarationAst(`const fn =
			() => {}
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(() => {})"
		`)
	})

	test("function", () => {
		let ast = codeToDeclarationAst(`const fn =
			function() {}
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(function() {})"
		`)
	})

	test("variable", () => {
		let ast = codeToDeclarationAst(`const fn =
			someFn
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(someFn)"
		`)
	})
})
