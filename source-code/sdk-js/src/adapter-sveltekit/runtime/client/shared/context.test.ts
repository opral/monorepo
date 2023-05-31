import { test, describe, expect, vi } from "vitest"
import { getRuntimeFromContext } from "./context.js"
import * as svelte from "svelte"

vi.mock("svelte", () => ({ getContext: vi.fn() }))
const getContextSpy = vi.spyOn(svelte, "getContext")

describe("getRuntimeFromContext", () => {
	test("should throw an error if not running in Svelte context", async () => {
		getContextSpy.mockImplementation(() => {
			throw new Error()
		})
		expect(() => getRuntimeFromContext()).toThrow()
	})

	test("should return the contents of getContext if in Svelte context", async () => {
		const obj = {}
		getContextSpy.mockReturnValue(obj)
		expect(getRuntimeFromContext()).toBe(obj)
	})
})
