import { describe, expect, it } from "vitest"
import sortAllVariants from "./sortAll.js"
import { createVariant, type Expression, type Variant } from "@inlang/sdk2"

describe("sortAllVariants", () => {
	it("should sort variants based on matches (desc-alphabetically)", () => {
		const variants: Variant[] = [
			createVariant({ messageId: "testId", id: "1", match: { letter: "a" } }),
			createVariant({ messageId: "testId", id: "2", match: { letter: "b" } }),
			createVariant({ messageId: "testId", id: "3", match: { letter: "c" } }),
		]
		const ignoreVariantIds: string[] = []
		const selectors: Expression[] = [
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
		]

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds, selectors })

		expect(sortedVariants).toEqual([
			createVariant({ messageId: "testId", id: "3", match: { letter: "c" } }),
			createVariant({ messageId: "testId", id: "2", match: { letter: "b" } }),
			createVariant({ messageId: "testId", id: "1", match: { letter: "a" } }),
		])
	})

	it("should sort variants based on matches (desc-alphabetically) complex", () => {
		const variants: Variant[] = [
			createVariant({
				messageId: "testId",
				id: "1",
				match: { letter1: "a", letter2: "b", letter3: "c" },
			}),
			createVariant({
				messageId: "testId",
				id: "2",
				match: { letter1: "b", letter2: "b", letter3: "b" },
			}),
			createVariant({
				messageId: "testId",
				id: "3",
				match: { letter1: "b", letter2: "a", letter3: "a" },
			}),
		]
		const ignoreVariantIds: string[] = []
		const selectors: Expression[] = [
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter1",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter2",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter3",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
		]

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds, selectors })

		expect(sortedVariants).toEqual([
			createVariant({
				messageId: "testId",
				id: "2",
				match: { letter1: "b", letter2: "b", letter3: "b" },
			}),
			createVariant({
				messageId: "testId",
				id: "3",
				match: { letter1: "b", letter2: "a", letter3: "a" },
			}),
			createVariant({
				messageId: "testId",
				id: "1",
				match: { letter1: "a", letter2: "b", letter3: "c" },
			}),
		])
	})

	it("should sort variants based on matches (desc-alphabetically) with ignoreVariantIds", () => {
		const variants: Variant[] = [
			createVariant({
				messageId: "testId",
				id: "1",
				match: { letter1: "a", letter2: "b", letter3: "c" },
			}),
			createVariant({
				messageId: "testId",
				id: "2",
				match: { letter1: "b", letter2: "b", letter3: "b" },
			}),
			createVariant({
				messageId: "testId",
				id: "3",
				match: { letter1: "b", letter2: "a", letter3: "a" },
			}),
			createVariant({
				messageId: "testId",
				id: "4",
				match: { letter1: "z", letter2: "z", letter3: "z" },
			}),
		]
		const ignoreVariantIds: string[] = ["4"]
		const selectors: Expression[] = [
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter1",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter2",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
			{
				type: "expression",
				arg: {
					type: "variable",
					name: "letter3",
				},
				annotation: {
					type: "function",
					name: "string",
					options: [],
				},
			},
		]

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds, selectors })

		expect(sortedVariants).toEqual([
			createVariant({
				messageId: "testId",
				id: "2",
				match: { letter1: "b", letter2: "b", letter3: "b" },
			}),
			createVariant({
				messageId: "testId",
				id: "3",
				match: { letter1: "b", letter2: "a", letter3: "a" },
			}),
			createVariant({
				messageId: "testId",
				id: "1",
				match: { letter1: "a", letter2: "b", letter3: "c" },
			}),
			createVariant({
				messageId: "testId",
				id: "4",
				match: { letter1: "z", letter2: "z", letter3: "z" },
			}),
		])
	})

	it("should handle empty variants array", () => {
		const variants: Variant[] = []
		const ignoreVariantIds: string[] = []
		const selectors: Expression[] = []

		const sortedVariants = sortAllVariants({ variants, ignoreVariantIds, selectors })

		expect(sortedVariants).toEqual([])
	})
})
