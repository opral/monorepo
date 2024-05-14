import { describe, it, expect } from "vitest"
import { createMessageBundle } from "./createMessageBundle.js"
import { MessageBundle } from "../v2/types.js"
import { Value } from "@sinclair/typebox/value"

describe("createMessageBundle", () => {
	it("creates a bundle with no messages", () => {
		const bundle: unknown = createMessageBundle({
			id: "hello_world",
			messages: {},
		})

		expect(Value.Check(MessageBundle, bundle)).toBe(true)

		expect(bundle).toEqual({
			id: "hello_world",
			alias: {},
			messages: [],
		} satisfies MessageBundle)
	})

	it("creates a bundle with messages and an alias", () => {
		const bundle: unknown = createMessageBundle({
			id: "happy_elephant",
			aliases: {
				default: "hello_world",
			},
			messages: {
				en: ".input {$name} {{Hello {$name}}}",
				de: ".input {$name} .match {$name} World {{Hallo Welt}} * {{Hallo {$name}}}",
			},
		})

		expect(Value.Check(MessageBundle, bundle)).toBe(true)
		expect(bundle).toMatchSnapshot()
	})
})
