import { describe, it, expect } from "vitest"
import { parse, print } from "recast"
import { convertExportedFunctionExpression } from "./ast.js"

describe("convert function expression to arrow function", () => {
	it("converts a basic function", () => {
		const code = `export function handle({ event, resolve }) {
    console.log('TADAA!')
    return resolve(event)
}`
		const codeAst = parse(code)
		convertExportedFunctionExpression(codeAst, "handle")
		const result = print(codeAst)
		expect(result.code).toMatchInlineSnapshot(`
"export const handle = ({ event, resolve }) => {
    console.log('TADAA!')
    return resolve(event)
};"
		`)
	})
})
