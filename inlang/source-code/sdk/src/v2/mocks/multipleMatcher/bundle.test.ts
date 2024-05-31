import { describe, it, expect } from "vitest"
import { multipleMatcherBundle } from "./bundle.js"
import { MessageBundle } from "../../types.js"
import { Value } from "@sinclair/typebox/value"

describe("mock plural messageBundle", () => {
	it("is valid", () => {
		const messageBundle: unknown = multipleMatcherBundle
		expect(Value.Check(MessageBundle, messageBundle)).toBe(true)
	})
})
