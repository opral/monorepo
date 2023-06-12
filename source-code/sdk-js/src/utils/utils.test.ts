import { describe, expect, test } from "vitest"
import { codeToSourceFile, nodeToCode, codeToNode } from "./utils.js"
import { Node, VariableDeclarationKind } from "ts-morph"

describe("codeToAst", () => {
	test("should return a File", () => {
		const node = codeToSourceFile("")
		expect(Node.isSourceFile(node)).toBe(true)
	})
})

// ------------------------------------------------------------------------------------------------

describe("codeToNode", () => {
	test("should throw if nothing matches", () => {
		expect(() => codeToNode("")).toThrow()
	})

	test("should throw an error if variable does not get named 'x'", () => {
		expect(() => codeToNode("const y = () => { }")).toThrow()
	})

	test("should throw an error if variable does not have an initializer", () => {
		expect(() => codeToNode("let x")).toThrow()
	})

	test("should return the arrow function expression", () => {
		const node = codeToNode("const x = () => { }")
		expect(Node.isArrowFunction(node)).toBe(true)
		expect(nodeToCode(node)).toMatchInlineSnapshot('"() => { }"')
	})

	test("should return the function expression", () => {
		const node = codeToNode("const x = function() { }")
		expect(Node.isFunctionExpression(node)).toBe(true)
		expect(nodeToCode(node)).toMatchInlineSnapshot('"function () { }"')
	})

	test("should return the named function expression", () => {
		const node = codeToNode("const x = function fn() {}")
		expect(Node.isFunctionExpression(node)).toBe(true)
		expect(nodeToCode(node)).toMatchInlineSnapshot('"function fn() { }"')
	})

	test("should return the call expression", () => {
		const node = codeToNode("const x = fn('hello')")
		expect(Node.isCallExpression(node)).toBe(true)
		expect(nodeToCode(node)).toMatchInlineSnapshot("\"fn('hello')\"")
	})

	test("should return an identifier", () => {
		const node = codeToNode("const x = func")
		expect(Node.isIdentifier(node)).toBe(true)
		expect(nodeToCode(node)).toMatchInlineSnapshot('"func"')
	})
})

// ------------------------------------------------------------------------------------------------

describe("astToCode", () => {
	test("should print formatted Code", () => {
		const node = codeToSourceFile("")
		node.addVariableStatement({
			declarationKind: VariableDeclarationKind.Const,
			declarations: [
				{
					name: "fn",
					initializer: '() => {  console.info("test"); }',
				},
			],
		})

		const code = nodeToCode(node)

		expect(code).toMatchInlineSnapshot('"const fn = () => { console.info(\\"test\\"); };"')
	})
})
