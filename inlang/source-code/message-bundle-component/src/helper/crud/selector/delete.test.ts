import { type Message } from "@inlang/sdk/v2"
import { describe, expect, it } from "vitest"
import deleteSelector from "./delete.js"

describe("deleteSelector", () => {
	it("Should delete selector", () => {
		const message: Message = {
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
			variants: [],
		}

		deleteSelector({ message, index: 0 })

		expect(message.selectors.length).toBe(1)
		// @ts-ignore
		expect(message.selectors[0]!.arg.name).toBe("name")
	})
})
