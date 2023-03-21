import { beforeEach, describe, expect, test, vi } from "vitest"
import { createLintRule } from "./rule.js"

const visitors = {}

const rule1 = createLintRule("my.id", "error", () => {
	return {
		visitors,
	}
})

// --------------------------------------------------------------------------------------------------------------------

vi.spyOn(console, "log").mockImplementation(vi.fn)

describe("createLintRule", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	describe("calling the function should", async () => {
		describe("return an object with", async () => {
			test("the correct id", async () => {
				const configuredRule = rule1()

				expect(configuredRule.id).toBe("my.id")
			})

			test("the correct level", async () => {
				const configuredRule = rule1()

				expect(configuredRule.level).toBe("error")
			})

			test("the passed visitors", async () => {
				const configuredRule = rule1()

				expect(configuredRule.visitors).toBe(visitors)
			})
		})

		describe("respect params and", async () => {
			test("change log level if specified", async () => {
				const configuredRule = rule1("warn")

				expect(configuredRule.level).toBe("warn")
			})
		})
	})
})
