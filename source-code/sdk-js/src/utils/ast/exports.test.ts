import { describe, expect, test } from "vitest"
import { findExport } from './exports.js';
import { astToCode, codeToAst, n } from '../recast.js';

describe("findExport", () => {
	test("should return undefined if no export was found", () => {
		const ast = codeToAst(``)

		const node = findExport(ast, 'load')
		expect(node).toBeUndefined()
	})

	test("should return undefined if export with the name was not found", () => {
		const ast = codeToAst(`
			export const fn = () => {}
		`)

		const node = findExport(ast, 'load')
		expect(node).toBeUndefined()
	})

	test("should find const export", () => {
		const ast = codeToAst(`
			export const load = () => {}
		`)

		const node = findExport(ast, 'load')!
		n.ArrowFunctionExpression.assert(node.value)
		expect(astToCode(node)).toMatchInlineSnapshot('"() => {}"')
	})

	test("should find let export", () => {
		const ast = codeToAst(`
			export let load = () => {}
		`)

		const node = findExport(ast, 'load')!
		n.ArrowFunctionExpression.assert(node.value)
		expect(astToCode(node)).toMatchInlineSnapshot('"() => {}"')
	})

	test("should find function export", () => {
		const ast = codeToAst(`
			export function load() {}
		`)

		const node = findExport(ast, 'load')!
		n.FunctionDeclaration.assert(node.value)
		expect(astToCode(node)).toMatchInlineSnapshot('"function load() {}"')
	})

	test("should find named exports", () => {
		const ast = codeToAst(`
			const fn = 'test'
			export { fn as load }
		`)

		const node = findExport(ast, 'load')!
		n.Identifier.assert(node.value)
		expect(astToCode(node)).toMatchInlineSnapshot('"fn"')
	})

	test("should find re-exported imports", () => {
		const ast = codeToAst(`
			export { fn as load } from 'some-module'
		`)

		const node = findExport(ast, 'load')!
		n.Identifier.assert(node.value)
		expect(astToCode(node)).toMatchInlineSnapshot('"fn"')
	})
})
