import { describe, expect, it } from "vitest"
import sortAllVariants from "./sortAll.js"
import { createVariant, type Variant } from "@inlang/sdk-v2"

describe("sortAllVariants", () => {
	it("should sort variants based on matches (desc-alphabetically)", () => {
		const variants: Variant[] = [
			createVariant({ messageId: "testId", id: "1", match: ["a"] }),
			createVariant({ messageId: "testId", id: "2", match: ["b"] }),
			createVariant({ messageId: "testId", id: "3", match: ["c"] }),
		]
		const ignoreVariantIds: string[] = []

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds })

		expect(sortedVariants).toEqual([
			createVariant({ messageId: "testId", id: "3", match: ["c"] }),
			createVariant({ messageId: "testId", id: "2", match: ["b"] }),
			createVariant({ messageId: "testId", id: "1", match: ["a"] }),
		])
	})

	it("should sort variants based on matches (desc-alphabetically) complex", () => {
		const variants: Variant[] = [
			createVariant({ messageId: "testId", id: "1", match: ["a", "b", "c"] }),
			createVariant({ messageId: "testId", id: "2", match: ["b", "b", "b"] }),
			createVariant({ messageId: "testId", id: "3", match: ["b", "a", "a"] }),
		]
		const ignoreVariantIds: string[] = []

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds })

		expect(sortedVariants).toEqual([
			createVariant({ messageId: "testId", id: "2", match: ["b", "b", "b"] }),
			createVariant({ messageId: "testId", id: "3", match: ["b", "a", "a"] }),
			createVariant({ messageId: "testId", id: "1", match: ["a", "b", "c"] }),
		])
	})

	it("should sort variants based on matches (desc-alphabetically) with ignoreVariantIds", () => {
		const variants: Variant[] = [
			createVariant({ messageId: "testId", id: "1", match: ["a", "b", "c"] }),
			createVariant({ messageId: "testId", id: "2", match: ["b", "b", "b"] }),
			createVariant({ messageId: "testId", id: "3", match: ["b", "a", "a"] }),
			createVariant({ messageId: "testId", id: "4", match: ["z", "z", "z"] }),
		]
		const ignoreVariantIds: string[] = ["4"]

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds })

		expect(sortedVariants).toEqual([
			createVariant({ messageId: "testId", id: "2", match: ["b", "b", "b"] }),
			createVariant({ messageId: "testId", id: "3", match: ["b", "a", "a"] }),
			createVariant({ messageId: "testId", id: "1", match: ["a", "b", "c"] }),
			createVariant({ messageId: "testId", id: "4", match: ["z", "z", "z"] }),
		])
	})

	it("should handle empty variants array", () => {
		const variants: Variant[] = []
		const ignoreVariantIds: string[] = []

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds })

		expect(sortedVariants).toEqual([])
	})
})
