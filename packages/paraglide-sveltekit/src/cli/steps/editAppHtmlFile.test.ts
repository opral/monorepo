import { describe, it, expect } from "vitest"
import { updateAppHTMLFile } from "./editAppHtmlFile"

describe("updateAppHTMLFile", () => {
	it("updates the lang attribute if present", () => {
		const html = `<html lang="en"></html>`
		const result = updateAppHTMLFile(html)

		expect(result.ok).toBe(true)
		expect(result.updated).toMatchInlineSnapshot(
			'"<html lang="%paraglide.lang%" dir="%paraglide.textDirection%"></html>"'
		)
	})

	it("updates doesn't re-add the dir attribute if already present", () => {
		const html = `<html dir=rtl lang="en"></html>`
		const result = updateAppHTMLFile(html)

		expect(result.ok).toBe(true)
		expect(result.updated).toMatchInlineSnapshot(
			'"<html dir="%paraglide.textDirection%" lang="%paraglide.lang%"></html>"'
		)
	})
})
