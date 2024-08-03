import { type MessageNested } from "@inlang/sdk2"
import { describe, expect, it } from "vitest"
import deleteSelector from "./delete.js"

describe("deleteSelector", () => {
	it("Should delete selector", () => {
		const message: MessageNested = {
			bundleId: "bundleTestId",
			id: "testId",
			locale: "en",
			selectors: [
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "count",
					},
				},
				{
					type: "expression",
					arg: {
						type: "variable",
						name: "name",
					},
				},
			],
			declarations: [],
			variants: [
				{
					id: "variantId",
					messageId: "testId",
					match: {
						count: "1",
						name: "John",
					},
					pattern: [
						{
							type: "text",
							value: "Hello ",
						},
					],
				},
			],
		}

		deleteSelector({ message, index: 0 })

		expect(message.selectors.length).toBe(1)
		// @ts-ignore
		expect(message.selectors[0]!.arg.name).toBe("name")
		expect(Object.keys(message.variants[0]!.match).length).toBe(1)
	})
})
