import { describe, it, expect } from "vitest"
import { InjectHeader } from "./injectHeader"
import { parse } from "svelte/compiler"
import MagicString from "magic-string"
import { HEADER_COMPONENT_MODULE_ID, HEADER_COMPONENT_NAME } from "../../constants"

describe("InjectHeader Pass", () => {
	it("should not apply if the file is not a page file", () => {
		const result = InjectHeader.condition({ filename: "src/components/Hello.svelte", content: "" })
		expect(result).toBe(false)
	})

	it("should apply if the file is a +page.svelte file", () => {
		const result = InjectHeader.condition({ filename: "src/routes/+page.svelte", content: "" })
		expect(result).toBe(true)
	})

	it("should apply if the file is a page file, but doesn't use the .svelte extention", () => {
		const result = InjectHeader.condition({ filename: "src/routes/+page.svx", content: "" })
		expect(result).toBe(true)
	})

	it("should inject the header", () => {
		const originalCode = `<h1>Hello</h1>`
		const ast = parse(originalCode)
		const code = new MagicString(originalCode)

		const { imports } = InjectHeader.apply({ ast, code, originalCode })

		expect(code.toString()).toContain(`<${HEADER_COMPONENT_NAME} />`)

		expect(
			imports.includes(`import ${HEADER_COMPONENT_NAME} from '${HEADER_COMPONENT_MODULE_ID}';`)
		).toBe(true)
	})
})
