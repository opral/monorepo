import { describe, it, expect } from "vitest"
import { examplePluralFormal } from "./messageBundles.js"
import { MessageBundle } from "../types.js"
import { Value } from "@sinclair/typebox/value"

describe("mock messageBundles", () => {
	it("plural_formal is valid", () => {
		const bundle: unknown = examplePluralFormal
		expect(Value.Check(MessageBundle, bundle)).toBe(true)
	})
})
