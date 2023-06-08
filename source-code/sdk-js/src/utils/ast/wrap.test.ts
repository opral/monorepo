import { describe, expect, test } from "vitest"
import { astToCode, codeToAst, codeToDeclarationAst } from '../recast.js';
import { createWrapperAst, mergeWrapperAst, wrapExportedFunction, wrapWithPlaceholder } from './wrap.js';

describe("wrapWithPlaceholder", () => {
	test("arrow function", () => {
		const ast = codeToDeclarationAst(`const x =
			() => {}
		`)

		wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(() => {})"
		`)
	})

	test("async arrow function", () => {
		const ast = codeToDeclarationAst(`const x =
			async () => {}
		`)

		wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(async () => {})"
		`)
	})

	test("function", () => {
		const ast = codeToDeclarationAst(`const x =
			function() {}
		`)

		wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(function() {})"
		`)
	})

	test("async function", () => {
		const ast = codeToDeclarationAst(`const x =
			async function() {}
		`)

		wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(async function() {})"
		`)
	})

	test("variable", () => {
		const ast = codeToDeclarationAst(`const x =
			someFn
		`)

		wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(someFn)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("createWrapperAst", () => {
	test("without params", () => {
		const ast = createWrapperAst('someFn')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"someFn().wrap($$_INLANG_WRAP_$$)"
		`)
	})

	test("with params", () => {
		const ast = createWrapperAst('someFn', '{ test: true }')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"someFn({
			   test: true
			}).wrap($$_INLANG_WRAP_$$)"
		`)
	})

	test("with nested params", () => {
		const ast = createWrapperAst('someFn', '{ nested: { fn: () => concole.log(123) } }')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"someFn({
			   nested: {
				   fn: () => concole.log(123)
				}
			}).wrap($$_INLANG_WRAP_$$)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("mergeWrapperAst", () => {
	test("arrow function", () => {
		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = codeToDeclarationAst(`const x =
			() => {}
		`)

		wrapWithPlaceholder(ast)
		mergeWrapperAst(ast, wrapWithAst)

		expect(astToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(() => {})"
		`)
	})

	test("async arrow function", () => {
		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = codeToDeclarationAst(`const x =
			async () => {}
		`)

		wrapWithPlaceholder(ast)
		mergeWrapperAst(ast, wrapWithAst)

		expect(astToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(async () => {})"
		`)
	})

	test("function", () => {
		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = codeToDeclarationAst(`const x =
			function() {}
		`)

		wrapWithPlaceholder(ast)
		mergeWrapperAst(ast, wrapWithAst)

		expect(astToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(function() {})"
		`)
	})

	test("async function", () => {
		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = codeToDeclarationAst(`const x =
			async function() {}
		`)

		wrapWithPlaceholder(ast)
		mergeWrapperAst(ast, wrapWithAst)

		expect(astToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(async function() {})"
		`)
	})

	test("variable", () => {
		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = codeToDeclarationAst(`const x =
			someFn
		`)

		wrapWithPlaceholder(ast)
		mergeWrapperAst(ast, wrapWithAst)

		expect(astToCode(wrapWithAst)).toMatchInlineSnapshot(`
			"initWrapper().wrap(someFn)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("wrapExportedFunction", () => {
	test("should add and wrap load function for empty file", () => {
		const ast = codeToAst("")
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(() => {});"
		`)
	})

	test("should add and wrap load function if not present", () => {
		const ast = codeToAst(`
			export const prerender = true
		`)
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const prerender = true;
			export const load = initWrapper().wrap(() => {});"
		`)
	})

	test("should wrap arrow function", () => {
		const ast = codeToAst(`
			export const load = () => {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(() => {});"
		`)
	})

	test("should wrap async arrow function", () => {
		const ast = codeToAst(`
			export const load = async () => {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async () => {});"
		`)
	})

	test("should wrap const function", () => {
		const ast = codeToAst(`
			export const load = function() {}
		`)

		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(function() {});"
		`)
	})

	test("should wrap async const function", () => {
		const ast = codeToAst(`
			export const load = async function() {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async function() {});"
		`)
	})

	test("should wrap regular function", () => {
		const ast = codeToAst(`
			export function load() {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(function load() {});"
		`)
	})

	test("should wrap regular async function", () => {
		const ast = codeToAst(`
			export async function load() {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper', 'load')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async function load() {});"
		`)
	})
})
