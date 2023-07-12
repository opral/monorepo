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

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot('"$$_INLANG_WRAP_$$(() => { })"')
	})

	test("async arrow function", () => {
		const node = codeToNode(`const x =
			async () => { }
		`)

		const wrapped = wrapWithPlaceholder(node)

		expect(nodeToCode(wrapped)).toMatchInlineSnapshot('"$$_INLANG_WRAP_$$(async () => { })"')
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
			"someFn().use($$_INLANG_WRAP_$$)"
		`)
	})

	test("with params", () => {
		const node = createWrapperAst("someFn", "{ test: true }")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"someFn({ test: true }).use($$_INLANG_WRAP_$$)"
		`)
	})

	test("with nested params", () => {
		const node = createWrapperAst("someFn", "{ nested: { fn: () => concole.log(123) } }")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"someFn({ nested: { fn: () => concole.log(123) } }).use($$_INLANG_WRAP_$$)"
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

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot('"initWrapper().use(() => { })"')
	})

	test("async arrow function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			async () => { }
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot('"initWrapper().use(async () => { })"')
	})

	test("function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			function() { }}
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot('"initWrapper().use(function () { })"')
	})

	test("async function", () => {
		const wrapWithAst = createWrapperAst("initWrapper")
		const node = codeToNode(`const x =
			async function() { }}
		`)

		const wrapped = wrapWithPlaceholder(node)
		mergeWrapperAst(wrapped, wrapWithAst)

		expect(nodeToCode(wrapWithAst)).toMatchInlineSnapshot(
			'"initWrapper().use(async function () { })"',
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
			"initWrapper().use(someFn)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("wrapExportedFunction", () => {
	test("should add and wrap load function for empty file", () => {
		const node = codeToSourceFile("")
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot('"export const load = initWrapper().use(() => { });"')
	})

	test("should add and wrap load function if not present", () => {
		const node = codeToSourceFile(`
			export const prerender = true
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const prerender = true;
			export const load = initWrapper().use(() => { });"
		`)
	})

	test("should wrap arrow function", () => {
		const node = codeToSourceFile(`
			export const load = () => { }
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot('"export const load = initWrapper().use(() => { });"')
	})

	test("should wrap async arrow function", () => {
		const node = codeToSourceFile(`
			export const load = async () => { }
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot('"export const load = initWrapper().use(async () => { });"')
	})

	test("should wrap const function", () => {
		const node = codeToSourceFile(`
			export const load = function() { }}
		`)

		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			'"export const load = initWrapper().use(function () { });"',
		)
	})

	test("should wrap async const function", () => {
		const node = codeToSourceFile(`
			export const load = async function() { }}
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot(
			'"export const load = initWrapper().use(async function () { });"',
		)
	})

	test("should wrap regular function", () => {
		const node = codeToSourceFile(`
			export function load() {}
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot('"export const load = initWrapper().use(function load() { });"')
	})

	test("should wrap regular async function", () => {
		const node = codeToSourceFile(`
			export async function load() {}
		`)
		wrapExportedFunction(node, "", "initWrapper", "load")

		expect(nodeToCode(node)).toMatchInlineSnapshot('"export const load = initWrapper().use(async function load() { });"')
	})

	test("should wrap export followed by a comment", () => {
		const node = codeToSourceFile(`
			export const handle = ({ resolve, event }) => {
				return resolve(event);
			}

			// a comment
		`)
		wrapExportedFunction(node, "", "initHandleWrapper", "handle")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"export const handle = initHandleWrapper().use(({ resolve, event }) => {
			    return resolve(event);
			});
			// a comment"
		`)
	})

	test("should wrap export with type information", () => {
		const node = codeToSourceFile(`
			import type { Handle } from '@sveltejs/kit'

			export const handle: Handle = ({ resolve, event }) => {
				return resolve(event);
			}
		`)
		wrapExportedFunction(node, "", "initHandleWrapper", "handle")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import type { Handle } from '@sveltejs/kit';
			export const handle: Handle = initHandleWrapper().use(({ resolve, event }) => {
			    return resolve(event);
			});"
		`)
	})

	test("should wrap export with satisfies", () => {
		const node = codeToSourceFile(`
			import type { Handle } from '@sveltejs/kit'

			export const handle = (({ resolve, event }) => {
				return resolve(event);
			}) satisfies Handle
		`)
		wrapExportedFunction(node, "", "initHandleWrapper", "handle")

		expect(nodeToCode(node)).toMatchInlineSnapshot(`
			"import type { Handle } from '@sveltejs/kit';
			export const handle = initHandleWrapper().use((({ resolve, event }) => {
			    return resolve(event);
			}) satisfies Handle);"
		`)
	})
})
