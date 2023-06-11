import { describe, expect, test } from "vitest"
import { findExport } from './exports.js';
import { nodeToCode, codeToSourceFile, n } from '../recast.js';

describe("findExport", () => {
	test("should return undefined if no export was found", () => {
		const node = codeToSourceFile(``)

		const exportNode = findExport(node, 'load')
		expect(exportNode).toBeUndefined()
	})

	test("should return undefined if export with the name was not found", () => {
		const node = codeToSourceFile(`
			export const fn = () => {}
		`)

		const exportNode = findExport(node, 'load')
		expect(exportNode).toBeUndefined()
	})

	test("should find const export", () => {
		const node = codeToSourceFile(`
			export const load = () => {}
		`)

		const exportNode = findExport(node, 'load')!
		n.VariableDeclarator.assert(exportNode.value)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"load = () => {}"')
	})

	test("should find let export", () => {
		const node = codeToSourceFile(`
			export let load = () => {}
		`)

		const exportNode = findExport(node, 'load')!
		n.VariableDeclarator.assert(exportNode.value)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"load = () => {}"')
	})

	test("should find function export", () => {
		const node = codeToSourceFile(`
			export function load() {}
		`)

		const exportNode = findExport(node, 'load')!
		n.FunctionDeclaration.assert(exportNode.value)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"function load() {}"')
	})

	test("should find named exports", () => {
		const node = codeToSourceFile(`
			const fn = 'test'
			export { fn as load }
		`)

		const exportNode = findExport(node, 'load')!
		n.ExportSpecifier.assert(exportNode.value)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"fn as load"')
	})

	test("should find re-exported imports", () => {
		const node = codeToSourceFile(`
			export { fn as load } from 'some-module'
		`)

		const exportNode = findExport(node, 'load')!
		n.ExportSpecifier.assert(exportNode.value)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"fn as load"')
	})
})
