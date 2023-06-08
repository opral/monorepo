import { describe, expect, test } from "vitest"
import { b, n, codeToAst, astToCode, codeToDeclarationAst } from './recast.js';

describe("codeToAst", () => {
	test("should return a File", () => {
		const ast = codeToAst("")
		n.File.assert(ast)
	})
})

// ------------------------------------------------------------------------------------------------

describe("codeToDeclarationAst", () => {
	test("should throw if nothing matches", () => {
		expect(() => codeToDeclarationAst("")).toThrow()
	})

	test("should return the arrow function expression", () => {
		const ast = codeToDeclarationAst("const x = () => {}")
		n.ArrowFunctionExpression.assert(ast.value)
		expect(astToCode(ast)).toMatchInlineSnapshot(
			'"() => {}"'
		)
	})

	test("should return the function expression", () => {
		const ast = codeToDeclarationAst("const x = function() {}")
		n.FunctionExpression.assert(ast.value)
		expect(astToCode(ast)).toMatchInlineSnapshot(
			'"function() {}"'
		)
	})

	test("should return the named function expression", () => {
		const ast = codeToDeclarationAst("const x = function fn() {}")
		n.FunctionExpression.assert(ast.value)
		expect(astToCode(ast)).toMatchInlineSnapshot(
			'"function fn() {}"'
		)
	})

	test("should return an identifier", () => {
		const ast = codeToDeclarationAst("const x = func")
		n.Identifier.assert(ast.value)
		expect(astToCode(ast)).toMatchInlineSnapshot(
			'"func"'
		)
	})
})

// ------------------------------------------------------------------------------------------------

describe("astToCode", () => {
	test("should print formatted Code", () => {
		const ast = astToCode(
			b.variableDeclaration(
				'const',
				[
					b.variableDeclarator(
						b.identifier("fn"),
						b.arrowFunctionExpression(
							[],
							b.blockStatement([
								b.expressionStatement(
									b.callExpression(
										b.memberExpression(b.identifier("console"), b.identifier("log")),
										[b.literal('test')]
									)
								)
							])
						)
					)
				]
			)
		)

		expect(ast).toMatchInlineSnapshot(`
			"const fn = () => {
			   console.log('test');
			};"
		`)
	})
})