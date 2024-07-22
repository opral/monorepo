import { describe, expect, it } from "vitest"
import updateMatch from "./updateMatch.js"
import { createVariant, type Variant } from "@inlang/sdk/v2"

describe("updateMatch", () => {
	it("should update the value at the specified match index", () => {
		const variant: Variant = createVariant({ id: "test-id", match: ["apple", "banana", "cherry"] })
		const matchIndex = 1
		const value = "orange"

		updateMatch({ variant, matchIndex, value })

		expect(variant.match[matchIndex]).toBe(value)
		expect(variant.match.length).toBe(3)
	})

	it("should not update the value if match index is out of range", () => {
		const variant: Variant = createVariant({ id: "test-id", match: ["apple", "banana", "cherry"] })
		const matchIndex = 3
		const value = "orange"

		updateMatch({ variant, matchIndex, value })

		expect(variant.match[matchIndex]).toBeUndefined()
		expect(variant.match.length).toBe(3)
	})

	it("should not update the value if match index is negative", () => {
		const variant: Variant = createVariant({ id: "test-id", match: ["apple", "banana", "cherry"] })
		const matchIndex = -1
		const value = "orange"

		updateMatch({ variant, matchIndex, value })

		expect(variant.match[matchIndex]).toBeUndefined()
		expect(variant.match.length).toBe(3)
	})
})
