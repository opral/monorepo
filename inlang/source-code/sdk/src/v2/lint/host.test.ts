import { describe, it, expect } from "vitest"
import { createLintReportQuery } from "./host.js"

describe("lint", () => {
	it("should work", async () => {
		await createLintReportQuery(["some-lint-rule", "another-lint-rule"])
		expect(true).toBe(true)
	})
})
