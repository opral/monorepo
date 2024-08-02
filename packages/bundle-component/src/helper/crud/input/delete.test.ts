import { describe, expect, it } from "vitest"
import deleteInput from "./delete.js"
import { createBundle } from "@inlang/sdk2"

describe("deleteInput", () => {
	it("Should delete a specific input declarations", () => {
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
						{
							type: "input",
							name: "user_name",
							value: {
								type: "expression",
								arg: {
									type: "variable",
									name: "user_name",
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
						{
							type: "input",
							name: "user_name",
							value: {
								type: "expression",
								arg: {
									type: "variable",
									name: "user_name",
								},
							},
						},
					],
					variants: [],
				},
			],
		})
		const inputs = deleteInput({
			messageBundle,
			input: messageBundle.messages[0]!.declarations[0]!,
		})
		expect(messageBundle.messages[0]!.declarations.length).toBe(1)
		expect(messageBundle.messages[1]!.declarations.length).toBe(1)
		expect(messageBundle.messages[0]!.declarations[0]!.name).toBe("user_name")
		expect(messageBundle.messages[1]!.declarations[0]!.name).toBe("user_name")
	})
})
