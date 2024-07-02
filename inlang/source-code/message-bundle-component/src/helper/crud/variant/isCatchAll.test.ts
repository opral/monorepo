import { createVariant } from "@inlang/sdk/v2"
import { describe, expect, it } from "vitest"
import variantIsCatchAll from "./isCatchAll.js"

describe("isCatchAll", () => {
	it("Should return true if variant is catchAll", () => {
		expect(variantIsCatchAll({ variant: createVariant({ match: ["*"] }) })).toBe(true)
		expect(variantIsCatchAll({ variant: createVariant({ match: ["*", "*"] }) })).toBe(true)
	})
	it("Should return false if variant is not catchAll", () => {
		expect(variantIsCatchAll({ variant: createVariant({ match: ["one"] }) })).toBe(false)
		expect(variantIsCatchAll({ variant: createVariant({ match: ["*", "one"] }) })).toBe(false)
		expect(variantIsCatchAll({ variant: createVariant({ match: ["one", "*"] }) })).toBe(false)
	})
})
