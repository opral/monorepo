import { createVariant } from "@inlang/sdk2"
import { describe, expect, it } from "vitest"
import variantIsCatchAll from "./isCatchAll.js"

describe("isCatchAll", () => {
	it("Should return true if variant is catchAll", () => {
		expect(
			variantIsCatchAll({ variant: createVariant({ messageId: "testId", match: { count: "*" } }) })
		).toBe(true)
		expect(
			variantIsCatchAll({
				variant: createVariant({ messageId: "testId", match: { count: "*", count2: "*" } }),
			})
		).toBe(true)
	})
	it("Should return false if variant is not catchAll", () => {
		expect(
			variantIsCatchAll({
				variant: createVariant({ messageId: "testId", match: { count: "one" } }),
			})
		).toBe(false)
		expect(
			variantIsCatchAll({
				variant: createVariant({ messageId: "testId", match: { count: "*", count2: "one" } }),
			})
		).toBe(false)
		expect(
			variantIsCatchAll({
				variant: createVariant({ messageId: "testId", match: { count: "one", count2: "*" } }),
			})
		).toBe(false)
	})
})
