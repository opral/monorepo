import { describe, expect, test } from "vitest"
import { astToCode, codeToAst, codeToDeclarationAst } from '../recast.js';
import { createWrapperAst, mergeWrapperAst, wrapExportedFunction, wrapWithPlaceholder } from './wrap.js';

describe("wrapWithPlaceholder", () => {
	test("arrow function", () => {
		let ast = codeToDeclarationAst(`const fn =
			() => {}
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(() => {})"
		`)
	})

	test("async arrow function", () => {
		let ast = codeToDeclarationAst(`const fn =
			async () => {}
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(async () => {})"
		`)
	})

	test("function", () => {
		let ast = codeToDeclarationAst(`const fn =
			function() {}
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(function() {})"
		`)
	})

	test("async function", () => {
		let ast = codeToDeclarationAst(`const fn =
			async function() {}
		`)

		ast = wrapWithPlaceholder(ast)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"$$_INLANG_WRAP_$$(async function() {})"
		`)
	})

	test("variable", () => {
		let ast = codeToDeclarationAst(`const fn =
			someFn
		`)

		ast = wrapWithPlaceholder(ast)

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
		const toWrapAst = wrapWithPlaceholder(codeToDeclarationAst(`const fn =
			() => {}
		`))

		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = mergeWrapperAst(toWrapAst, wrapWithAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"initWrapper().wrap(() => {})"
		`)
	})

	test("async arrow function", () => {
		const toWrapAst = wrapWithPlaceholder(codeToDeclarationAst(`const fn =
			async () => {}
		`))

		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = mergeWrapperAst(toWrapAst, wrapWithAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"initWrapper().wrap(async () => {})"
		`)
	})

	test("function", () => {
		const toWrapAst = wrapWithPlaceholder(codeToDeclarationAst(`const fn =
			function() {}
		`))

		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = mergeWrapperAst(toWrapAst, wrapWithAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"initWrapper().wrap(function() {})"
		`)
	})

	test("async function", () => {
		const toWrapAst = wrapWithPlaceholder(codeToDeclarationAst(`const fn =
			async function() {}
		`))

		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = mergeWrapperAst(toWrapAst, wrapWithAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"initWrapper().wrap(async function() {})"
		`)
	})

	test("variable", () => {
		const toWrapAst = wrapWithPlaceholder(codeToDeclarationAst(`const fn =
			someFn
		`))

		const wrapWithAst = createWrapperAst('initWrapper')
		const ast = mergeWrapperAst(toWrapAst, wrapWithAst)

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"initWrapper().wrap(someFn)"
		`)
	})
})

// ------------------------------------------------------------------------------------------------

describe("wrapExportedFunction", () => {
	test("should add and wrap load function for empty file", () => {
		const ast = codeToAst("")
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(() => {});"
		`)
	})

	test("should add and wrap load function if not present", () => {
		const ast = codeToAst(`
			export const prerender = true
		`)
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const prerender = true;
			export const load = initWrapper().wrap(() => {});"
		`)
	})

	test("should wrap arrow function", () => {
		const ast = codeToAst(`
			export const load = () => {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(() => {});"
		`)
	})

	test("should wrap async arrow function", () => {
		const ast = codeToAst(`
			export const load = async () => {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async () => {});"
		`)
	})

	test("should wrap const function", () => {
		const ast = codeToAst(`
			export const load = function() {}
		`)

		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(function() {});"
		`)
	})

	test("should wrap regular function", () => {
		const ast = codeToAst(`
			export const load = async function() {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async function() {});"
		`)
	})

	test("should wrap regular function", () => {
		const ast = codeToAst(`
			export function load() {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(function load() {});"
		`)
	})

	test("should wrap regular async function", () => {
		const ast = codeToAst(`
			export async function load() {}
		`)
		wrapExportedFunction(ast, '', 'initWrapper')

		expect(astToCode(ast)).toMatchInlineSnapshot(`
			"export const load = initWrapper().wrap(async function load() {});"
		`)
	})
})
