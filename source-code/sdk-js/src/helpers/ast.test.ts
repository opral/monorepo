import { describe, it, expect } from "vitest"
import { parseModule, generateCode } from "magicast"
import { convertExportedFunctionExpression } from "./ast.js"

describe("convert function expression to arrow function", () => {
	it("converts a basic function", () => {
		const code = `export function handle({ event, resolve }) {
    console.log('TADAA!')
    return resolve(event)
}`
		const codeAst = parseModule(code)
		convertExportedFunctionExpression(codeAst.$ast, "handle")
		const result = generateCode(codeAst)
		expect(result.code).toMatchInlineSnapshot(`
"export const handle = ({ event, resolve }) => {
    console.log('TADAA!')
    return resolve(event)
};"
		`)
	})
})
