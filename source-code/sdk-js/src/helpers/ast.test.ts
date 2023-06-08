import { types, print } from "recast"
import { dedent } from "ts-dedent"
import { describe, expect, test } from "vitest"
import {
	mergeNodes,
	findUsedImportsInAst,
	getFunctionOrDeclarationValue,
	identifierIsDeclarable,
	findAlias,
	findDefinition,
	imports,
} from "./ast.js"
import { parseModule } from "magicast"
import type { Program } from "estree"

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
                console.info("load")
            }
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "function load() {
                console.info(\\"load\\")
            }"
        `)
	})
	test("arrow function", () => {
		const code = dedent`
            export const load = () => {
                console.info("load")
            }
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "() => {
                console.info(\\"load\\")
            }"
        `)
	})
	test("declaration value", () => {
		const code = dedent`
            const loadFn = () => {
                console.info("load")
            }
            export const load = loadFn
        `
		const ast = parseModule(code)
		const resultAst = getFunctionOrDeclarationValue(ast.$ast, "load")
		const result = print(resultAst)
		expect(result.code).toMatchInlineSnapshot(`
            "loadFn"
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
				console.info(iAlias)
				console.info(language)
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
				console.info(iAlias)
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

// describe("mergeNodes", () => {
/* test("Add simple property to empty object", () => {
		// {key2: key2Alias}
		const property = b.property("init", b.identifier("key2"), b.identifier("key2Alias"))
		// {}
		const object = b.objectPattern([])
		extendObjectPattern(object, property)
		expect(print(object).code).toBe(`{key2: key2Alias}`)
	}) */
// })

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
		test("Simple within variable declaration, value", () => {
			const code = `const {key: value} = {key: "blue"}`
			const ast = parseModule(code).$ast
			const resultAst = findAlias(ast, "value")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("value")
		})
		test("Simple within variable declaration, key", () => {
			const code = `const {key: value} = {key: "blue"}`
			const ast = parseModule(code).$ast
			const resultAst = findAlias(ast, "key")[0]
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
		test("simple function alias chain", () => {
			const code = dedent`
				function one() {}
				const two = one
				const three = two
			`
			const ast = parseModule(code).$ast
			const resultAst = findAlias(ast, "one", true)[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("three")
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

describe("findDefinition", () => {
	describe("variable declarator", () => {
		test("simple", () => {
			const code = dedent`
				const blue = green;
			`
			const ast = parseModule(code).$ast
			const resultAst = findDefinition(ast, "blue")[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe("green")
		})
		test("simple, deep", () => {
			const code = dedent`
				const green = "green";
				const blue = green;
			`
			const ast = parseModule(code).$ast
			const resultAst = findDefinition(ast, "blue", true)[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toBe('"green"')
		})
	})

	describe("function declaration", () => {
		test("named function, 1 level", () => {
			const code = dedent`
				import {i} from "@inlang/sdk-js"
				function hndl() {
					console.info(i)
				}
				export const handle = hndl
			`
			const ast = parseModule(code).$ast
			const resultAst = findDefinition(ast, "handle", true)[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toMatchInlineSnapshot(`
				"function hndl() {
					console.info(i)
				}"
			`)
		})
		test("named function, 2 levels", () => {
			const code = dedent`
				import {i} from "@inlang/sdk-js"
				function hndl() {
					console.info(i)
				}
				const hndl1 = hndl
				export const identifier = hndl1
			`
			const ast = parseModule(code).$ast
			const resultAst = findDefinition(ast, "identifier", true)[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toMatchInlineSnapshot(`
				"function hndl() {
					console.info(i)
				}"
			`)
		})
		test("arrow function, 2 levels", () => {
			const code = dedent`
				import {i} from "@inlang/sdk-js"
				const hndl = () => {
					console.info(i)
				}
				const hndl1 = hndl
				export const handle = hndl1
			`
			const ast = parseModule(code).$ast
			const resultAst = findDefinition(ast, "handle", true)[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toMatchInlineSnapshot(`
				"() => {
					console.info(i)
				}"
			`)
		})

		test("async arrow function, 1 level, call expression", () => {
			const code = dedent`
				import { sequence } from "@sveltejs/kit/hooks";
				import { i } from "@inlang/sdk-js";

				const seq1 = async ({ event, resolve }) => {
					console.info(i("welcome"));
					return resolve(event);
				};

				export const handle = sequence(seq1);
			`
			const ast = parseModule(code).$ast
			const resultAst = findDefinition(ast, "handle", true)[0]
			const result = resultAst ? print(resultAst).code : ""
			expect(result).toMatchInlineSnapshot(`
			"sequence(seq1)"
			`)
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
				expect(print(ast).code).toMatchInlineSnapshot(`
					"{
					    key: alias,
					    key2: alias2
					}"
				`)
			})
			test("Simple pattern, return alias", () => {
				// const {key: alias} = ...
				const ast = b.objectPattern([
					b.property("init", b.identifier("key"), b.identifier("alias")),
				])
				// merge property: `key: alias2`
				const { newName } =
					mergeNodes(
						ast,
						b.property("init", b.identifier("key"), b.identifier("alias2")),
					)[0]?.[0] ?? {}
				expect(newName ? print(newName).code : "").toEqual("alias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"{
					    key: alias
					}"
				`)
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
				expect(print(ast).code).toMatchInlineSnapshot(`
					"{
					    key: alias
					}"
				`)
			})
		})
		test("... into identifier", () => {
			// const identifier = ...
			const ast = b.identifier("identifier")
			// merge property: `key: alias2`
			const result = mergeNodes(
				ast,
				b.property("init", b.identifier("key"), b.identifier("alias2")),
			)[0]?.[0]?.newName
			const resultCode = result ? print(result).code : ""
			expect(resultCode).toBe("identifier.key")
			expect(print(ast).code).toMatchInlineSnapshot(`
				"identifier"
			`)
		})
	})
	describe("merge function declaration", () => {
		describe("... into function declaration", () => {
			test("Simple object pattern into empty function", () => {
				// function identifier() {}
				const ast = b.functionDeclaration(b.identifier("identifier"), [], b.blockStatement([]))
				// merge `function identifier({key:alias}) {}`
				const result = mergeNodes(
					ast,
					b.functionDeclaration(
						b.identifier("identifier"),
						[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
						b.blockStatement([]),
					),
				)
				expect(result).toEqual([[], undefined])
				expect(print(ast).code).toMatchInlineSnapshot(`
					"function identifier(
					    {
					        key: alias
					    }
					) {}"
			`)
			})
			test("Simple object pattern params into function with object pattern params", () => {
				// function identifier() {}
				const ast = b.functionDeclaration(
					b.identifier("identifier"),
					[b.objectPattern([b.property("init", b.identifier("key2"), b.identifier("alias2"))])],
					b.blockStatement([]),
				)
				// merge `function identifier({key:alias}) {}`
				const result = mergeNodes(
					ast,
					b.functionDeclaration(
						b.identifier("identifier"),
						[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
						b.blockStatement([]),
					),
				)
				expect(result).toEqual([[], undefined])
				expect(print(ast).code).toMatchInlineSnapshot(`
					"function identifier(
					    {
					        key2: alias2,
					        key: alias
					    }
					) {}"
				`)
			})
		})
		describe("... into arrow function declaration", () => {
			test("Simple declaration", () => {
				const code = dedent`
					import {i} from "@inlang/sdk-js"
					const hndl = () => {
						console.info(i)
					}
					const hndl1 = hndl
					export const identifier = hndl1
				`
				const ast = parseModule(code).$ast
				// merge `function identifier({key:alias}) {}`
				const result = mergeNodes(
					ast,
					b.functionDeclaration(
						b.identifier("identifier"),
						[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
						b.blockStatement([]),
					),
				)
				expect(result).toEqual([[], undefined])
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import {i} from \\"@inlang/sdk-js\\"
					const hndl = (
					    {
					        key: alias
					    }
					) => {
						console.info(i)
					}
					const hndl1 = hndl
					export const identifier = hndl1"
				`)
			})
			test("Rename parameters", () => {
				const code = dedent`
					import {i} from "@inlang/sdk-js"
					const hndl = (parameter1) => {
						console.info(i)
					}
					const hndl1 = hndl
					export const identifier = hndl1
				`
				const ast = parseModule(code).$ast
				// merge `function identifier({key:alias}) {}`
				const { originalName, newName, scope } =
					mergeNodes(
						ast,
						b.functionDeclaration(
							b.identifier("identifier"),
							[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
							b.blockStatement([]),
						),
					)[0]?.[0] ?? {}
				expect(originalName ? print(originalName).code : "").toBe("alias")
				expect(newName ? print(newName).code : "").toBe("parameter1.key")
				expect(scope ? print(scope).code : "").toMatchInlineSnapshot(`
					"{
						console.info(i)
					}"
				`)
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import {i} from \\"@inlang/sdk-js\\"
					const hndl = (parameter1) => {
						console.info(i)
					}
					const hndl1 = hndl
					export const identifier = hndl1"
				`)
			})
		})
	})
	describe("Merge export statement", () => {
		describe("... into Program", () => {
			test("Simple function", () => {
				const code = dedent`
					export function identifier() {}
				`
				const ast = parseModule(code).$ast
				const result = mergeNodes(
					ast,
					b.exportNamedDeclaration(
						b.functionDeclaration(
							b.identifier("identifier"),
							[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
							b.blockStatement([]),
						),
					),
				)
				expect(result).toEqual([[], undefined])
				expect(print(ast).code).toMatchInlineSnapshot(`
					"export function identifier(
					  {
					    key: alias
					  }
					) {}"
				`)
			})
			test("Simple function, append", () => {
				const code = dedent`
					export function identifier2() {}
				`
				const ast = parseModule(code).$ast
				const result = mergeNodes(
					ast,
					b.exportNamedDeclaration(
						b.functionDeclaration(
							b.identifier("identifier"),
							[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
							b.blockStatement([]),
						),
					),
				)
				expect(result).toEqual([[], undefined])
				expect(print(ast).code).toMatchInlineSnapshot(`
					"export function identifier2() {}

					export function identifier(
					  {
					    key: alias
					  }
					) {}"
				`)
			})
			test("function declaration chain", () => {
				const code = dedent`
					import {i} from "@inlang/sdk-js"
					function hndl() {
						console.info(i)
					}
					const hndl1 = hndl
					export const identifier = hndl1
				`
				const ast = parseModule(code).$ast
				// merge `export function identifier({key:alias}) {}`
				const result = mergeNodes(
					ast,
					b.exportNamedDeclaration(
						b.functionDeclaration(
							b.identifier("identifier"),
							[b.objectPattern([b.property("init", b.identifier("key"), b.identifier("alias"))])],
							b.blockStatement([]),
						),
					),
				)
				expect(result).toEqual([[], undefined])
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import {i} from \\"@inlang/sdk-js\\"
					function hndl(
					    {
					        key: alias
					    }
					) {
						console.info(i)
					}
					const hndl1 = hndl
					export const identifier = hndl1"
				`)
			})
		})
	})
})

describe("imports", () => {
	describe("references", () => {
		test("empty file", () => {
			const code = ``
			const ast = parseModule(code).$ast
			expect(imports(ast as Program, "source").findReferences()).toBe(undefined)
		})
		test("single matching import", () => {
			const code = dedent`
				import {module} from "source"
				console.info()
			`
			const ast = parseModule(code).$ast
			const result = imports(ast as Program, "source").findReferences()
			expect(result?.[0] ? print(result[0]).code : "").toMatchInlineSnapshot(`
				"import {module} from \\"source\\""
			`)
		})
		test("multiple matching imports", () => {
			const code = dedent`
				import {module} from "source"
				import {module2} from "source"
				console.info()
			`
			const ast = parseModule(code).$ast
			const result = imports(ast as Program, "source").findReferences()
			expect(result?.[0] ? print(result[0]).code : "").toMatchInlineSnapshot(`
				"import {module} from \\"source\\""
			`)
			expect(result?.[1] ? print(result[1]).code : "").toMatchInlineSnapshot(`
				"import {module2} from \\"source\\""
			`)
		})
	})
	describe("add", () => {
		describe("Regular ...", () => {
			test("... into empty", () => {
				const code = dedent`
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import { exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into regular", () => {
				const code = dedent`
					import { export2N as alias2N } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import { export2N as alias2N, exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into regular, duplicate", () => {
				const code = dedent`
					import { exportN as aliasN } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasDuplicateN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import { exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into regular and namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					import { export2N as alias2N } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					import { export2N as alias2N, exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into default", () => {
				const code = dedent`
					import { default as defaultAlias } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import { default as defaultAlias, exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into default and namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					import { default as defaultAlias } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					import { default as defaultAlias, exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("exportN", "aliasN")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					console.info()"
				`)
			})
		})
		describe("Default ...", () => {
			test("... into empty", () => {
				const code = dedent`
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("default", "defaultAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import defaultAlias from \\"source\\";
					console.info()"
				`)
			})
			test("... into regular", () => {
				const code = dedent`
					import { exportN as aliasN } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("default", "defaultAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import defaultAlias, { exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into regular and namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					import { exportN as aliasN } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("default", "defaultAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					import defaultAlias, { exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into default", () => {
				const code = dedent`
					import { default as defaultAlias } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("default", "defaultDuplicateAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import { default as defaultAlias } from \\"source\\";
					console.info()"
				`)
			})
			test("... into default and namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					import { default as defaultAlias } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("default", "defaultDuplicateAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					import { default as defaultAlias } from \\"source\\";
					console.info()"
				`)
			})
			test("... into namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("default", "defaultAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					console.info()"
				`)
			})
		})
		describe("Namespace ...", () => {
			test("... into empty", () => {
				const code = dedent`
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("*", "namespaceAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					console.info()"
				`)
			})
			test("... into regular", () => {
				const code = dedent`
					import { exportN as aliasN } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("*", "namespaceAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					import { exportN as aliasN } from \\"source\\";
					console.info()"
				`)
			})
			test("... into default", () => {
				const code = dedent`
					import { default as defaultAlias } from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("*", "namespaceAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					import { default as defaultAlias } from \\"source\\";
					console.info()"
				`)
			})
			test("... into namespace", () => {
				const code = dedent`
					import * as namespaceAlias from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("*", "namespaceDuplicateAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import * as namespaceAlias from \\"source\\";
					console.info()"
				`)
			})
			test("... into namespace and regular", () => {
				const code = dedent`
					import { exportN as aliasN } from "source";
					import * as namespaceAlias from "source";
					console.info()
				`
				const ast = parseModule(code).$ast
				imports(ast as Program, "source").add("*", "namespaceDuplicateAlias")
				expect(print(ast).code).toMatchInlineSnapshot(`
					"import { exportN as aliasN } from \\"source\\";
					import * as namespaceAlias from \\"source\\";
					console.info()"
				`)
			})
		})
	})
	describe("getAliases", () => {
		test("Detect miscellaneous aliases", () => {
			const code = dedent`
				import { exportN as aliasN, export2N, default as defaultAlias } from "source";
				import defaultAlias2 from "source";
				import * as namespaceAlias from "source";
				console.info()
			`
			const ast = parseModule(code).$ast
			const { aliases } = imports(ast as Program, "source").getAliases("default", "requested")
			const regularAlias = aliases?.get("exportN")
			const regular2Alias = aliases?.get("export2N")
			const defaultAlias = aliases?.get("default")
			const namespaceAlias = aliases?.get("*")
			const requestedAlias = aliases?.get("requested")
			expect(aliases?.size).toBe(5)
			expect(regularAlias ? print(regularAlias).code : "").toEqual("aliasN")
			expect(regular2Alias ? print(regular2Alias).code : "").toEqual("export2N")
			expect(defaultAlias ? print(defaultAlias).code : "").toEqual("defaultAlias2")
			expect(namespaceAlias ? print(namespaceAlias).code : "").toEqual("namespaceAlias")
			expect(requestedAlias ? print(requestedAlias).code : "").toEqual("namespaceAlias.requested")
		})
		test("Return error for nonexistent alias", () => {
			const code = dedent`
				import { exportN as aliasN, default as defaultAlias } from "source";
				console.info()
			`
			const ast = parseModule(code).$ast
			const { error } = imports(ast as Program, "source").getAliases("nonexistent")
			expect(error).toBeInstanceOf(Error)
			expect(error?.message).toBe(
				"The alias for nonexistent does not exist. Maybe call imports(...).add() first?",
			)
		})
	})
	describe("removeAll", () => {
		test("No delete", () => {
			const code = dedent`
				console.info()
			`
			const ast = parseModule(code).$ast
			imports(ast as Program, "source").removeAll()
			expect(print(ast).code).toMatchInlineSnapshot(`
				"console.info()"
			`)
		})
		test("Multiple lines", () => {
			const code = dedent`
				import { exportN as aliasN, default as defaultAlias } from "source";
				import * as namespaceAlias from "source";
				console.info()
			`
			const ast = parseModule(code).$ast
			imports(ast as Program, "source").removeAll()
			expect(print(ast).code).toMatchInlineSnapshot(`
				"console.info()"
			`)
		})
	})
})
