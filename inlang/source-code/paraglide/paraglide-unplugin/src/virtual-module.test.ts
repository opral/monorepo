import { describe, it, expect } from "vitest"
// @ts-ignore
import { availableLanguageTags } from "$paraglide/runtime.js"
// @ts-ignore
import * as en from "$paraglide/messages/en.js"
// @ts-ignore
import * as de from "$paraglide/messages/de.js"

describe("e2e", () => {
	it("can load runtime.js", () => {
		expect(availableLanguageTags).toEqual(["en", "de"])
	})

	it("can load messages/<lang>.js", () => {
		expect(en.my_message).toBeDefined()
		expect(de.my_message).toBeDefined()
	})
})
