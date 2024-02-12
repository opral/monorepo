import { test, expect } from "vitest"
import { someFunction } from "./temp"
import { languageTag } from "$paraglide/runtime.js"

test("it resolves the alias", () => {
	expect(someFunction()).toBe("de")
	expect(languageTag()).toBe("de")
})
