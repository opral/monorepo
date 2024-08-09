import { describe, it, expect } from "vitest"
import { compile } from "./compile.js"
import { createBundle, MessageNested } from "@inlang/sdk2"

const msg: MessageNested = {
	locale: "en",
	bundleId: "happy_elephant_bundle",
	id: "some_message",
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
			match: ["1", "2"],
			pattern: [{ type: "text", value: "One" }],
		},
		{
			id: "2",
			messageId: "some_message",
			match: ["*", "*"],
			pattern: [{ type: "text", value: "Many" }],
		},
	],
}

const germanMessage: MessageNested = {
	id: "some_message_de",
	locale: "de",
	bundleId: "happy_elephant_bundle",
	declarations: [],
	selectors: [],
	variants: [
		{
			id: "some_variant",
			match: [],
			messageId: "some_message_de",
			pattern: [{ type: "text", value: "Hallo Welt!" }],
		},
	],
}

describe("compile", () => {
	it("compiles", async () => {
		const bundleId = "happy_elephant_bundle"
		const bundle = createBundle({
			id: bundleId,
			alias: {
				"inlang-messageformat": "bundle_alias",
			},
			messages: [msg, germanMessage],
		})

		const output = await compile({
			bundles: [bundle],
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
			projectId: undefined,
		})

		expect(output).toMatchInlineSnapshot()
	})
})
