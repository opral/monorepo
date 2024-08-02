import { describe, expect, it } from "vitest"
import updateMatch from "./updateMatch.js"
import { createVariant, type Variant } from "@inlang/sdk2"

describe("updateMatch", () => {
	it("should update the value at the specified match index", () => {
		const variant: Variant = createVariant({
			messageId: "testId",
			id: "test-id",
			match: { selector1: "apple", selector2: "banana", selector3: "cherry" },
		})
		const selectorName = "selector2"
		const value = "orange"

		updateMatch({ variant, selectorName, value })

		expect(variant.match[selectorName]).toBe(value)
		expect(Object.keys(variant.match).length).toBe(3)
	})

	it("should not update the value if match name doesn't exist", () => {
		const variant: Variant = createVariant({
			messageId: "testId",
			id: "test-id",
			match: { selector1: "apple", selector2: "banana", selector3: "cherry" },
		})
		const selectorName = "selector4"
		const value = "orange"

		updateMatch({ variant, selectorName, value })

		expect(variant.match[selectorName]).toBeUndefined()
		expect(Object.keys(variant.match).length).toBe(3)
	})
})
