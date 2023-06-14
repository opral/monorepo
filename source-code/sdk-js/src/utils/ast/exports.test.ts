import { describe, expect, test } from "vitest"
import { findExport, findOrCreateExport } from "./exports.js"
import { nodeToCode, codeToSourceFile } from "../utils.js"
import { Node } from "ts-morph"

describe("findExport", () => {
	test("should return undefined if no export was found", () => {
		const node = codeToSourceFile(``)

		const exportNode = findExport(node, "load")

		expect(exportNode).toBeUndefined()
	})

	test("should return undefined if export with the name was not found", () => {
		const node = codeToSourceFile(`
			export const fn = () => { }
		`)

		const exportNode = findExport(node, "load")

		expect(exportNode).toBeUndefined()
	})

	test("should find const export", () => {
		const node = codeToSourceFile(`
			export const load = () => { }
		`)

		const exportNode = findExport(node, "load")!

		expect(Node.isVariableDeclaration(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"load = () => { }"')
	})

	test("should find let export", () => {
		const node = codeToSourceFile(`
			export let load = () => { }
		`)

		const exportNode = findExport(node, "load")!

		expect(Node.isVariableDeclaration(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"load = () => { }"')
	})

	test("should find function export", () => {
		const node = codeToSourceFile(`
			export function load() {}
		`)

		const exportNode = findExport(node, "load")!

		expect(Node.isFunctionDeclaration(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"function load() { }"')
	})

	test("should find named exports", () => {
		const node = codeToSourceFile(`
			const fn = 'test'
			export { fn as load }
		`)

		const exportNode = findExport(node, "load")!

		expect(Node.isExportSpecifier(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"fn as load"')
	})

	test("should find re-exported imports", () => {
		const node = codeToSourceFile(`
			export { fn as load } from 'some-module'
		`)

		const exportNode = findExport(node, "load")!

		expect(Node.isExportSpecifier(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"fn as load"')
	})
})

describe("findOrCreateExport", () => {
	test("should find existing export", () => {
		const node = codeToSourceFile(`
			export function load() {}
		`)

		const exportNode = findOrCreateExport(node, "load")!

		expect(Node.isFunctionDeclaration(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"function load() { }"')
	})

	test("should throw an error if a non-exWported variable with the same name already exists", () => {
		const node = codeToSourceFile(`
			const load = () => { }
		`)

		expect(() => findOrCreateExport(node, "load")).toThrow()
	})

	test("should create an export if export is missing", () => {
		const node = codeToSourceFile("")

		const exportNode = findOrCreateExport(node, "load")!

		expect(Node.isVariableDeclaration(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"load = () => { }"')
	})

	test("should create an export with a custom function implementation", () => {
		const node = codeToSourceFile("")

		const exportNode = findOrCreateExport(node, "load", "(param) => console.log(param)")!

		expect(Node.isVariableDeclaration(exportNode)).toBe(true)
		expect(nodeToCode(exportNode)).toMatchInlineSnapshot('"load = (param) => console.log(param)"')
	})
})
