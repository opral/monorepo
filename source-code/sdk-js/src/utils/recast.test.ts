import { describe, expect, test } from "vitest"
import { b, n, codeToSourceFile, nodeToCode, codeToNode } from './recast.js';

describe("codeToAst", () => {
	test("should return a File", () => {
		const node = codeToSourceFile("")
		n.File.assert(node)
	})
})

// ------------------------------------------------------------------------------------------------

describe("codeToDeclarationAst", () => {
	test("should throw if nothing matches", () => {
		expect(() => codeToNode("")).toThrow()
	})

	test("should throw an error if variable does not get named 'x'", () => {
		expect(() => codeToNode("const y = () => {}")).toThrow()
	})

	test("should return the arrow function expression", () => {
		const ast = codeToNode("const x = () => {}")
		n.ArrowFunctionExpression.assert(ast.value)
		expect(nodeToCode(ast)).toMatchInlineSnapshot(
			'"() => {}"'
		)
	})

	test("should return the function expression", () => {
		const ast = codeToNode("const x = function() {}")
		n.FunctionExpression.assert(ast.value)
		expect(nodeToCode(ast)).toMatchInlineSnapshot(
			'"function() {}"'
		)
	})

	test("should return the named function expression", () => {
		const ast = codeToNode("const x = function fn() {}")
		n.FunctionExpression.assert(ast.value)
		expect(nodeToCode(ast)).toMatchInlineSnapshot(
			'"function fn() {}"'
		)
	})

	test("should return the call expression", () => {
		const ast = codeToNode("const x = fn('hello')")
		n.CallExpression.assert(ast.value)
		expect(nodeToCode(ast)).toMatchInlineSnapshot(
			'"fn(\'hello\')"'
		)
	})

	test("should return an identifier", () => {
		const ast = codeToNode("const x = func")
		n.Identifier.assert(ast.value)
		expect(nodeToCode(ast)).toMatchInlineSnapshot(
			'"func"'
		)
	})
})

// ------------------------------------------------------------------------------------------------

describe("astToCode", () => {
	test("should print formatted Code", () => {
		const ast = nodeToCode(
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
										b.memberExpression(b.identifier("console"), b.identifier("info")),
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
			   console.info('test');
			};"
		`)
	})
})