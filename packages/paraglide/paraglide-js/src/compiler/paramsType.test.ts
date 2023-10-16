import { it, expect } from "vitest"
import { paramsType } from "./paramsType.js"

it("should return valid jsdoc from params", () => {
	const jsdoc = paramsType({ name: "NonNullable<unknown>", count: "NonNullable<unknown>" })
	expect(jsdoc).toBe("@param {{ name: NonNullable<unknown>, count: NonNullable<unknown> }} params")
})
