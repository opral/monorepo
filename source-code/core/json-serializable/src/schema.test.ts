import { Value } from "@sinclair/typebox/value"
import { JSONSerializableObject } from "./schema.js"
import { it, expect, describe } from "vitest"

describe("JSONSerializableObject", () => {
	it("should enforce an object as value", () => {
		// @ts-expect-error - Value is not an object
		const invalid: JSONSerializableObject = "hello"
		const valid: JSONSerializableObject = {}
		expect(Value.Check(JSONSerializableObject, invalid)).toBe(false)
		expect(Value.Check(JSONSerializableObject, valid)).toBe(true)
	})

	it("should be possible to have one nested object layer", () => {
		const mockJson: JSONSerializableObject = {
			"x.plugin.y": {},
		}
		expect(Value.Check(JSONSerializableObject, mockJson)).toBe(true)
	})
})
