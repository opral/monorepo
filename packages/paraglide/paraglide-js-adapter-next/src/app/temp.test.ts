import { test, expect } from "vitest"
import { someFunction } from "./temp"

test("it resolves the alias", () => {
	expect(someFunction()).toBe("de")
})
