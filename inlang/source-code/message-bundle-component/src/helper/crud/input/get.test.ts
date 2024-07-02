import { describe, expect, it } from "vitest"
import getInput from "./get.js"
import { createMessageBundle } from "@inlang/sdk/v2"

describe("getInput", () => {
	it("Should return all found input declarations", () => {
		const messageBundle = createMessageBundle({
			id: "bundleId",
			messages: [
				{
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
					id: "testId",
					locale: "en",
					selectors: [],
					declarations: [],
					variants: [],
				},
			],
		})
		const inputs = getInput({ messageBundle })
		expect(inputs.length).toBe(1)
		expect(inputs[0]!.name).toBe("count")
	})
})
