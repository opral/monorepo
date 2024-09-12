import { test, expect, vi, beforeEach } from "vitest"

beforeEach(() => {
	// clear plugin state between tests
	vi.resetModules()
})

test("toBeImportedFiles should work with locale as setting", async () => {
	const { plugin } = await import("./plugin.js")

	const result = await plugin.toBeImportedFiles?.({
		nodeFs: {} as any,
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/translations/{locale}.json",
			},
		},
	})

	expect(result).toEqual(["/translations/en.json", "/translations/de.json"])
})

test("toBeImportedFiles should work with languageTag as setting for backward compatibility", async () => {
	const { plugin } = await import("./plugin.js")

	const result = await plugin.toBeImportedFiles?.({
		nodeFs: {} as any,
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/translations/{languageTag}.json",
			},
		},
	})

	expect(result).toEqual(["/translations/en.json", "/translations/de.json"])
})
