import { describe, expect, test } from "vitest"
import { findExport } from './exports.js';
import { codeToAst } from '../recast.js';

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

		const node = findExport(ast, 'load')

		expect(node).toBeDefined()
	})

	test("should find let export", () => {
		const ast = codeToAst(`
			export let load = () => {}
		`)

		const node = findExport(ast, 'load')

		expect(node).toBeDefined()
	})

	test("should find named exports", () => {
		const ast = codeToAst(`
			const fn = 'test'
			export { fn as load }
		`)

		const node = findExport(ast, 'load')

		expect(node).toBeDefined()
	})

	test("should find re-exported imports", () => {
		const ast = codeToAst(`
			export { fn as load } from 'some-module'
		`)

		const node = findExport(ast, 'load')

		expect(node).toBeDefined()
	})
})
