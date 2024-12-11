import { describe, it, expect, vi } from "vitest"
import { memoized } from "./memo.js"

describe("memoized", () => {
	it("runs the function when first called", async () => {
		const fn = vi.fn(async (arg: string) => arg)
		const memo = memoized(fn)

		const arg = await memo("arg")
		expect(arg).toEqual("arg")
		expect(fn).toHaveBeenCalledOnce()
	})

	it("runs doesn't re-run if called multiple times with same input", async () => {
		const fn = vi.fn(async (arg: string) => arg)
		const memo = memoized(fn)

		await memo("arg")
		const arg = await memo("arg")

		expect(arg).toEqual("arg")
		expect(fn).toHaveBeenCalledOnce()
	})

	it("re-runs if called multiple times with different input", async () => {
		const fn = vi.fn(async (arg: string) => arg)
		const memo = memoized(fn)

		await memo("arg1")
		await memo("arg1")
		await memo("arg2")
		const arg = await memo("arg2")

		expect(arg).toEqual("arg2")
		expect(fn).toHaveBeenCalledTimes(2)
	})
})
