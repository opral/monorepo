import { describe, it, expect } from "vitest"
import { dedent } from "ts-dedent"
import { parse, print } from "recast"
import { convertExportedFunctionExpression } from "./ast.js"

describe("convert arrow to function expression", () => {
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
