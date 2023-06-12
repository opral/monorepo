import { describe, expect, test } from "vitest"
import { nodeToCode, codeToSourceFile, codeToNode } from "../utils.js"
import {
	createWrapperAst,
	mergeWrapperAst,
	wrapExportedFunction,
	wrapWithPlaceholder,
} from "./wrap.js"

describe("wrapWithPlaceholder", () => {
	test("should throw an error if node kind is not supported", () => {
		const node = codeToSourceFile("")

		expect(() => wrapWithPlaceholder(node)).toThrow()
	})

	test("arrow function", () => {
		const node = codeToNode(`const x =
			() => { }
		`)

		const wrapped = wrapWithPlaceholder(node)

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(() => { })"
		`)
	})

	test("async arrow function", () => {
		const node = codeToNode(`const x =
			async () => { }
		`)

		const wrapped = wrapWithPlaceholder(node)

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(async () => { })"
		`)
	})

	test("function", () => {
		const node = codeToNode(`const x =
			function() { }}
		`)

		const wrapped = wrapWithPlaceholder(node)

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot('"$$_INLANG_WRAP_$$(function () { })"')
	})

	test("async function", () => {
		const node = codeToNode(`const x =
			async function() { }}
		`)

		const wrapped = wrapWithPlaceholder(node)

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot('"$$_INLANG_WRAP_$$(async function () { })"')
	})

	test("variable", () => {
		const node = codeToNode(`const x =
			someFn
		`)

		const wrapped = wrapWithPlaceholder(node)

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(someFn)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("createWrapperAst", () => {
	test("without params", () => {
		const node = createWrapperAst("someFn")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"someFn().wrap($$_INLANG_WRAP_$$)"
		`)
	})

	test("with params", () => {
		const node = createWrapperAst("someFn", "{ test: true }")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"someFn({ test: true }).wrap($$_INLANG_WRAP_$$)"
		`)
	})

	test("with nested params", () => {
		const node = createWrapperAst("someFn", "{ nested: { fn: () => concole.log(123) } }")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"someFn({ nested: { fn: () => concole.log(123) } }).wrap($$_INLANG_WRAP_$$)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("mergeWrapperAst", () => {
	test("arrow function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			() => { }
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(() => { })"
		`)
	})

	test("async arrow function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			async () => { }
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(async () => { })"
		`)
	})

	test("function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			function() { }}
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot('"initWrapper().wrap(function () { })"')
	})

	test("async function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			async function() { }}
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot(
			'"initWrapper().wrap(async function () { })"',
		)
	})

	test("variable", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			someFn
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(someFn)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("wrapExportedFunction", () => {
	test("should add and wrap load function for empty file", () => {
		const node = codeToSourceFile("")
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(() => { });"
		`)
	})

	test("should add and wrap load function if not present", () => {
		const node = codeToSourceFile(`
			export const prerender = true
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const prerender = true;
			export const load = initWrapper().wrap(() => { });"
		`)
	})

	test("should wrap arrow function", () => {
		const node = codeToSourceFile(`
			export const load = () => { }
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(() => { });"
		`)
	})

	test("should wrap async arrow function", () => {
		const node = codeToSourceFile(`
			export const load = async () => { }
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async () => { });"
		`)
	})

	test("should wrap const function", () => {
		const node = codeToSourceFile(`
			export const load = function() { }}
		`)

		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			'"export const load = initWrapper().wrap(function () { });"',
		)
	})

	test("should wrap async const function", () => {
		const node = codeToSourceFile(`
			export const load = async function() { }}
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			'"export const load = initWrapper().wrap(async function () { });"',
		)
	})

	test("should wrap regular function", () => {
		const node = codeToSourceFile(`
			export function load() {}
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(function load() { });"
		`)
	})

	test("should wrap regular async function", () => {
		const node = codeToSourceFile(`
			export async function load() {}
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async function load() { });"
		`)
	})
})
