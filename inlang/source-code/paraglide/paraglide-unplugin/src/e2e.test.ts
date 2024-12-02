import { describe, it, expect } from "vitest"

import { availableLanguageTags } from "$paraglide/runtime.js"
import * as en from "$paraglide/messages/en.js"
import * as de from "$paraglide/messages/de.js"

describe("e2e", () => {
	it("can load runtime.js", () => {
		expect(availableLanguageTags).toEqual(["en", "de"])
	})

	it("can load messages/<lang>.js", () => {
		expect(true).toEqual(true)
	})
})
