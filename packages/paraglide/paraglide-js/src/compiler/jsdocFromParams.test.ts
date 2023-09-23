import { it, expect } from "vitest"
import { jsdocFromParams } from "./jsdocFromParams.js"

it("should return valid jsdoc from params", () => {
	const jsdoc = jsdocFromParams({ name: "NonNullable<unknown>", count: "NonNullable<unknown>" })
	expect(jsdoc).toBe(
		"/** @param {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} params */",
	)
})
