import { it, expect } from "vitest"
import { paramsType } from "./paramsType.js"

it("should return valid jsdoc from params", () => {
	const jsdoc = paramsType({ name: "NonNullable<unknown>", count: "NonNullable<unknown>" }, true)
	expect(jsdoc).toBe("@param {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} params")
})

it("should return optional params if no params are needed, but we're in the messageIndex file", () => {
	const jsdoc = paramsType({}, true)
	expect(jsdoc).toBe("@param {{}} params")
})

it("should not return optional params if no params are needed, and we're not in the messageIndex file", () => {
	const jsdoc = paramsType({}, false)
	expect(jsdoc).toBe("")
})

it("should quote param names that aren't valid JS identifiers", () => {
	const jsdoc = paramsType(
		{
			"not valid": "NonNullable<unknown>",
		},
		false
	)
	expect(jsdoc).toBe("@param {{ 'not valid': NonNullable<unknown> }} params")
})
