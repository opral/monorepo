import { it, expect } from "vitest"
import { compileMessage } from "./compileMessage.js"
import type { MessageNested } from "@inlang/sdk2"
import { DEFAULT_REGISTRY } from "./registry.js"

it("compiles a message with a single variant", async () => {
	const mockMessage: MessageNested = {
		locale: "en",
		id: "mock_message",
		bundleId: "mock_bundle",
		declarations: [],
		selectors: [],
		variants: [
			{
				id: "1",
				messageId: "some_message",
				match: {},
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
		declarations: [
			{
				type: "input",
				name: "fistInput",
				value: { type: "expression", arg: { type: "variable", name: "fistInput" } },
			},
			{
				type: "input",
				name: "secondInput",
				value: { type: "expression", arg: { type: "variable", name: "second Input" } },
			},
		],
		selectors: [
			{ type: "expression", arg: { type: "variable", name: "fistInput" } },
			{
				type: "expression",
				arg: { type: "variable", name: "second Input" },
				annotation: { type: "function", name: "plural", options: [] },
			},
		],
		variants: [
			{
				id: "1",
				messageId: "some_message",
				match: { firstInput: "1", secondInput: "2" },
				pattern: [
					{ type: "text", value: "One" },
					{
						type: "expression",
						arg: { type: "variable", name: "fistInput" },
						annotation: {
							type: "function",
							name: "number",
							options: [],
						},
					},
				],
			},
			{
				id: "2",
				messageId: "some_message",
				match: { firstInput: "*", secondInput: "*" },
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
