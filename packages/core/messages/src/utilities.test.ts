import { getVariant } from "./utilities.js"
import { describe, test, expect } from "vitest"
import type { Message } from "./api.js"

describe("getVariant", () => {
	test("should return the correct variant of a message", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			languageTag: "en",
			selectors: { gender: "female", guestOther: "1" },
		})
		// should return the female variant
		expect(variant.data![0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} to her party.",
		})
	})

	test("should return the correct fallback because the exact match does not exist", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			languageTag: "en",
			selectors: { gender: "female", guestOther: "0" },
		})
		// should return the female variant
		expect(variant.data![0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} does not give a party.",
		})
	})

	test("the matcher should resolve not existing selectors to '*'", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			languageTag: "en",
			selectors: { guestOther: "0" },
		})
		// should return the female variant
		expect(variant.data![0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} does not give a party.",
		})
	})

	test("empty selector should result in '*','*'", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			languageTag: "en",
			selectors: {},
		})
		// should return the female variant
		expect(variant.data![0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} and {$guestsOther} other people to their party.",
		})
	})

	test("non existing selector values should be resolved", () => {
		const mockMessage: Message = getMockMessage()

		const variant = getVariant(mockMessage, {
			languageTag: "en",
			selectors: { gender: "trans", guestOther: "2" },
		})
		// should return the female variant
		expect(variant.data![0]).toStrictEqual({
			type: "Text",
			value: "{$hostName} invites {$guestName} and one other person to their party.",
		})

		// const variant2 = getVariant(mockMessage, {
		// 	languageTag: "en",
		// 	selectors: { gender: "male", guestOther: "8" },
		// })
		// // should return the female variant
		// expect(variant2.data![0]).toStrictEqual({
		// 	type: "Text",
		// 	value: "{$hostName} invites {$guestName} and {$guestsOther} other people to his party.",
		// })
	})
})

const getMockMessage = (): Message => {
	return {
		id: "first-message",
		expressions: [],
		selectors: ["gender", "guestOther"],
		body: {
			en: [
				{
					match: { gender: "female", guestOther: "1" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} invites {$guestName} to her party.",
						},
					],
				},
				{
					match: { gender: "female", guestOther: "2" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} invites {$guestName} and one other person to her party.",
						},
					],
				},
				{
					match: { gender: "female", guestOther: "*" },
					pattern: [
						{
							type: "Text",
							value:
								"{$hostName} invites {$guestName} and {$guestsOther} other people to her party.",
						},
					],
				},
				{
					match: { gender: "male", guestOther: "1" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} invites {$guestName} to his party.",
						},
					],
				},
				{
					match: { gender: "male", guestOther: "2" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} invites {$guestName} and one other person to his party.",
						},
					],
				},
				{
					match: { gender: "male", guestOther: "*" },
					pattern: [
						{
							type: "Text",
							value:
								"{$hostName} invites {$guestName} and {$guestsOther} other people to his party.",
						},
					],
				},
				{
					match: { gender: "*", guestOther: "0" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} does not give a party.",
						},
					],
				},
				{
					match: { gender: "*", guestOther: "1" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} invites {$guestName} to their party.",
						},
					],
				},
				{
					match: { gender: "*", guestOther: "2" },
					pattern: [
						{
							type: "Text",
							value: "{$hostName} invites {$guestName} and one other person to their party.",
						},
					],
				},
				{
					match: { gender: "*", guestOther: "*" },
					pattern: [
						{
							type: "Text",
							value:
								"{$hostName} invites {$guestName} and {$guestsOther} other people to their party.",
						},
					],
				},
			],
		},
	}
}
