import { describe, it, expect } from "vitest"
import { createLintReportQuery } from "./host.js"

describe("lint", () => {
	it("should work", async () => {
		await createLintReportQuery(
			"/somewhere",
			["https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js"],
			{
				// @ts-ignore
				readFile: async () => {
					throw new Error()
				},
			}
		)

		expect(true).toBe(true)
	})
})
