import { types, print } from "recast"
import { dedent } from "ts-dedent"
import { describe, expect, test } from "vitest"
import {
	mergeNodes,
	findUsedImportsInAst,
	getFunctionOrDeclarationValue,
	identifierIsDeclarable,
	findAlias,
} from "./ast.js"
import { parseModule } from "magicast"

const b = types.builders
const fallbackFunction = b.arrowFunctionExpression([], b.blockStatement([]))

describe("getFunctionOrDeclarationValue", () => {
	test("fallback arrow function specified", () => {
		const code = dedent``
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load", fallbackFunction)
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {}"
        `)
	})
	test("fallback arrow function not specified", () => {
		const code = dedent``
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {}"
        `)
	})
	test("function", () => {
		const code = dedent`
            export function load() {
                console.log("load")
            }
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "function load() {
                console.log(\\"load\\")
            }"
        `)
	})
	test("arrow function", () => {
		const code = dedent`
            export const load = () => {
                console.log("load")
            }
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {
                console.log(\\"load\\")
            }"
        `)
	})
	test("declaration value", () => {
		const code = dedent`
            const loadFn = () => {
                console.log("load")
            }
            export const load = loadFn
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => loadFn"
        `)
	})
})

describe("findUsedImportsInAst", () => {
	test("Return empty array on empty array input", () => {
		const code = dedent``
		const ast = parseModule(code)
		const usedImports = findUsedImportsInAst(ast.$ast)
		expect(usedImports).toEqual([])
	})
	test("Return matching array 1", () => {
		const code = dedent`
			function load() {
				console.log(iAlias)
				console.log(language)
			}
		`
		const ast = parseModule(code)
		const usedImports = findUsedImportsInAst(ast.$ast, [
			["i", "iAlias"],
			["language", "language"],
		])
		expect(usedImports).toEqual([
			["i", "iAlias"],
			["language", "language"],
		])
	})
	test("Return matching array 2", () => {
		const code = dedent`
			function load() {
				console.log(iAlias)
			}
		`
		const ast = parseModule(code)
		const usedImports = findUsedImportsInAst(ast.$ast, [
			["i", "iAlias"],
			["language", "language"],
		])
		expect(usedImports).toEqual([["i", "iAlias"]])
	})
})

describe("mergeNodes", () => {
	/* test("Add simple property to empty object", () => {
		// {key2: key2Alias}
		const property = b.property("init", b.identifier("key2"), b.identifier("key2Alias"))
		// {}
		const object = b.objectPattern([])
		extendObjectPattern(object, property)
		expect(print(object).code).toBe(`{key2: key2Alias}`)
	}) */
})

describe("identifierIsDeclarable", () => {
	test("Test non declarable object property 1", () => {
		const code = `const {key: value, key1: value1} = {}`
		const ast = parseModule(code)
		expect(identifierIsDeclarable(ast.$ast, "value1")[0]).toBe(false)
	})
	test("Test non declarable object property 2", () => {
		const ast = b.objectPattern([
			b.property("init", b.identifier("key"), b.identifier("value")),
			b.property("init", b.identifier("key1"), b.identifier("value1")),
		])
		expect(identifierIsDeclarable(ast, "value1")[0]).toBe(false)
	})
	test("Test declarable object property", () => {
		const code = `const {key: value, key1: value1} = {}`
		const ast = parseModule(code)
		expect(identifierIsDeclarable(ast.$ast, "value2")[0]).toBe(true)
	})
	test("Test identifier not present in ast", () => {
		const code = `function load() {}`
		const ast = parseModule(code)
		expect(identifierIsDeclarable(ast.$ast, "value2")[0]).toBe(true)
	})
	test("Test identifier in unsupported ast", () => {
		const code = `const load = () => {}`
		const ast = parseModule(code)
		expect(identifierIsDeclarable(ast.$ast, "load")[1]).toBeInstanceOf(Error)
	})
})

describe("findAlias", () => {
	describe("object pattern", () => {
		test("Simple with alias", () => {
			// const {alias, ...rest} = ...
			const ast = b.objectPattern([
				b.property("init", b.identifier("alias"), b.identifier("alias")),
				b.restProperty(b.identifier("rest")),
			])
			const resultAst = findAlias(ast, "alias")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("alias")
		})
		test("Simple with alias, key", () => {
			// const {key: alias, ...rest} = ...
			const ast = b.objectPattern([
				b.property("init", b.identifier("key"), b.identifier("alias")),
				b.restProperty(b.identifier("rest")),
			])
			const resultAst = findAlias(ast, "key")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("alias")
		})
		test("Simple with alias, alias", () => {
			// const {key: alias, ...rest} = ...
			const ast = b.objectPattern([
				b.property("init", b.identifier("key"), b.identifier("alias")),
				b.restProperty(b.identifier("rest")),
			])
			const resultAst = findAlias(ast, "alias")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("alias")
		})
		test("Simple with ...rest property", () => {
			// const {key: alias, ...rest} = ...
			const ast = b.objectPattern([
				b.property("init", b.identifier("key"), b.identifier("alias")),
				b.restProperty(b.identifier("rest")),
			])
			const resultAst = findAlias(ast, "key2")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("rest")
		})
		test("Simple without an alias", () => {
			// const {key: alias} = ...
			const ast = b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])
			expect(findAlias(ast, "key2")[1]).toBeInstanceOf(Error)
		})
		test("Simple within variable declaration", () => {
			const code = `const {key: value} = {key: "blue"}`
			const ast = parseModule(code).$ast
			const resultAst = findAlias(ast, "value")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("value")
		})
	})
	describe("function declaration", () => {
		test("simple function", () => {
			const code = `function one() {}`
			const ast = parseModule(code).$ast
			const resultAst = findAlias(ast, "one")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("one")
		})
	})
	describe("variable declaration", () => {
		test("simple declaration", () => {
			const code = `const blue = "blue"`
			const ast = parseModule(code).$ast
			const resultAst = findAlias(ast, "blue")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("blue")
		})
	})
})

describe("mergeNodes", () => {
	describe("merge object pattern", () => {
		describe("... into object pattern", () => {
			test("Simple pattern", () => {
				// const {key: alias} = ...
				const ast = b.objectPattern([
					b.property("init", b.identifier("key"), b.identifier("alias")),
				])
				// merge property: `key2: alias2`
				const result = mergeNodes(
					ast,
					b.property("init", b.identifier("key2"), b.identifier("alias2")),
				)
				expect(result).toEqual([[], undefined])
			})
			test("Simple pattern, return alias", () => {
				// const {key: alias} = ...
				const ast = b.objectPattern([
					b.property("init", b.identifier("key"), b.identifier("alias")),
				])
				// merge property: `key: alias2`
				const result = mergeNodes(
					ast,
					b.property("init", b.identifier("key"), b.identifier("alias2")),
				)[0]?.[0]?.[1]
				const resultCode = result ? print(result).code : ""
				expect(resultCode).toEqual("alias")
			})
			test("Simple pattern, fail with reassigment", () => {
				// const {key: alias} = ...
				const ast = b.objectPattern([
					b.property("init", b.identifier("key"), b.identifier("alias")),
				])
				// merge property: `key2: alias`
				const result = mergeNodes(
					ast,
					b.property("init", b.identifier("key2"), b.identifier("alias")),
				)
				expect(result[1]).toBeInstanceOf(Error)
				expect(result[1]?.message).toBe("Some of the requested identifiers are already in use.")
			})
		})
		test("... into identifier", () => {
			// const identifier = ...
			const ast = b.identifier("identifier")
			// merge property: `key: alias2`
			const result = mergeNodes(
				ast,
				b.property("init", b.identifier("key"), b.identifier("alias2")),
			)[0]?.[0]?.[1]
			const resultCode = result ? print(result).code : ""
			expect(resultCode).toBe("identifier.key")
		})
	})
})
