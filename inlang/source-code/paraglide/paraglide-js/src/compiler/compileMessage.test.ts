import { it, expect } from "vitest"
import { compileMessage } from "./compileMessage.js"
import type { MessageNested } from "@inlang/sdk2"
import { DEFAULT_REGISTRY } from "./registry.js"

it("compiles a message with a single variant", async () => {
	const mockMessage: MessageNested = {
		locale: "en",
		id: "mock_message",
		bundleId: "mock_bundle",
		selectors: [],
		variants: [
			{
				id: "1",
				messageId: "some_message",
				matches: [],
				pattern: [{ type: "text", value: "Hello" }],
			},
		],
	}

	const compiled = compileMessage(mockMessage, DEFAULT_REGISTRY)

	const { mock_message } = await import("data:text/javascript;base64," + btoa(compiled.code))

	expect(mock_message({})).toBe("Hello")
})

it("compiles a message with variants", async () => {
	const msg: MessageNested = {
		locale: "en",
		id: "some_message",
		bundleId: "some_bundle",
		selectors: [
			{ type: "variable-reference", name: "fistInput" },
			{ type: "variable-reference", name: "secondInput" },
		],
		variants: [
			{
				id: "1",
				messageId: "some_message",
				matches: [
					{ type: "literal-match", key: "fistInput", value: "1" },
					{ type: "literal-match", key: "secondInput", value: "2" },
				],
				pattern: [
					{ type: "text", value: "One" },
					{
						type: "expression",
						arg: { type: "variable-reference", name: "fistInput" },
					},
				],
			},
			{
				id: "2",
				messageId: "some_message",
				matches: [
					{ type: "catchall-match", key: "fistInput" },
					{ type: "catchall-match", key: "secondInput" },
				],
				pattern: [{ type: "text", value: "Many" }],
			},
		],
	}

	const compiled = compileMessage(msg, DEFAULT_REGISTRY)

	expect(compiled.typeRestrictions).toEqual({
		fistInput: "number",
		"second Input": "number",
	})
	expect(compiled.code).toMatchInlineSnapshot(`
			"/**
			 * @param {{ fistInput: number, 'second Input': number }} inputs
			 * @returns {string}
			 */
			/* @__NO_SIDE_EFFECTS__ */
			export const some_message = (inputs) => {
				const selectors = [ inputs.fistInput, registry.plural("en", inputs['second Input']) ]
					if (selectors[0] == "1" && selectors[1] == "2") return \`One\${registry.number("en", inputs.fistInput)}\`
				return \`Many\`
			}"
		`)
})
