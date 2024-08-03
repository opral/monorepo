/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest"
import { ProjectSettings } from "../schema/settings.js"
import { Volume } from "memfs"
import { loadProjectFromDirectory } from "./loadProjectFromDirectory.js"
import { selectBundleNested } from "../query-utilities/selectBundleNested.js"
import type { Text } from "../schema/schemaV2.js"

test("plugin.loadMessages and plugin.saveMessages should work for legacy purposes", async () => {
	const mockRepo = {
		"./README.md": "# Hello World",
		"./src/index.js": "console.log('Hello World')",
		"./src/translations/en.json": JSON.stringify({
			key1: "value1",
			key2: "value2",
		}),
		"./src/translations/de.json": JSON.stringify({
			key1: "wert1",
			key2: "wert2",
		}),
		"./project.inlang/settings.json": JSON.stringify({
			baseLocale: "en",
			locales: ["en", "de"],
			modules: ["./mock-module.js"],
		} satisfies ProjectSettings),
	}
	const fs = Volume.fromJSON(mockRepo).promises
	const project = await loadProjectFromDirectory({ fs: fs as any, path: "./project.inlang" })
	const bundles = await selectBundleNested(project.db).execute()
	const bundlesOrdered = bundles.sort((a, b) =>
		a.alias["default"]!.localeCompare(b.alias["default"]!)
	)
	expect(bundles.length).toBe(2)
	expect(bundlesOrdered[0]?.alias.default).toBe("key1")
	expect(bundlesOrdered[1]?.alias.default).toBe("key2")
	expect(bundlesOrdered[0]?.messages[0]?.locale).toBe("en")
	expect((bundlesOrdered[0]?.messages[0]?.variants[0]?.pattern[0] as Text)?.value).toBe("value1")
	expect((bundlesOrdered[0]?.messages[0]?.variants[1]?.pattern[0] as Text)?.value).toBe("value2")

	expect(bundlesOrdered[0]?.messages[1]?.locale).toBe("de")
	expect((bundlesOrdered[0]?.messages[1]?.variants[0]?.pattern[0] as Text)?.value).toBe("wert1")
	expect((bundlesOrdered[0]?.messages[1]?.variants[1]?.pattern[0] as Text)?.value).toBe("wert2")
})
