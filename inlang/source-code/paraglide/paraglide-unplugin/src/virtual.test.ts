// @ts-ignore
import test from "$virtual/file1.js"
import { describe, it, expect } from "vitest"

describe("virtual", () => {
	it("works", () => {
		expect(test).toBe(true)
	})
})
