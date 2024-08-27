import { describe, expect, it } from "vitest"
import getInput from "./get.js"
import { createBundle } from "@inlang/sdk2"

describe("getInput", () => {
	it("Should return all found input declarations", () => {
		const messageBundle = createBundle({
			id: "bundleId",
			messages: [
				{
					bundleId: "bundleId",
					id: "testId",
					locale: "en",
					selectors: [],
					declarations: [
						{
							type: "input",
							name: "count",
							value: {
								type: "expression",
								arg: {
									type: "variable",
									name: "count",
								},
							},
						},
					],
					variants: [],
				},
				{
					bundleId: "bundleId",
					id: "testId",
					locale: "en",
					selectors: [],
					declarations: [
						{
							type: "input",
							name: "count",
							value: {
								type: "expression",
								arg: {
									type: "variable",
									name: "count",
								},
							},
						},
					],
					variants: [],
				},
				{
					bundleId: "bundleId",
					id: "testId",
					locale: "en",
					selectors: [],
					declarations: [],
					variants: [],
				},
			],
		})
		const inputs = getInput({ messages: messageBundle.messages })
		expect(inputs.length).toBe(1)
		expect(inputs[0]!.name).toBe("count")
	})
})
