import { describe, expect, it } from "vitest"
import createInput from "./create.js"
import { createMessageBundle } from "@inlang/sdk/v2"

describe("createInput", () => {
	it("Should create an input declarations", () => {
		const messageBundle = createMessageBundle({
			id: "bundleId",
			messages: [
				{
					id: "testId1",
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
					id: "testId2",
					locale: "de",
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
			],
		})

		createInput({ messageBundle, inputName: "user_name" })

		expect(messageBundle.messages[0]!.declarations.length).toBe(2)
		expect(messageBundle.messages[0]!.declarations[1]!.name).toBe("user_name")
	})
})
