import { Volume } from "memfs"
import { test, expect, vi, beforeEach } from "vitest"

beforeEach(() => {
	// clear plugin state between tests
	vi.resetModules()
})

test("toBeImportedFiles should work with locale as setting", async () => {
	const fs = Volume.fromJSON({
		"/translations/en.json": "mock en",
		"/translations/de.json": "mock de",
	}).promises

	const { plugin } = await import("./plugin.js")

	const result = await plugin.toBeImportedFiles?.({
		nodeFs: fs as any,
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/translations/{locale}.json",
			},
		},
	})

	expect(result).toEqual([
		{
			path: "/translations/en.json",
			content: "mock en",
		},
		{
			path: "/translations/de.json",
			content: "mock de",
		},
	])
})
