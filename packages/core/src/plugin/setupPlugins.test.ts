import { it, expect, vi } from "vitest"
import { createPlugin } from "./createPlugin.js"
import { setupPlugins } from "./setupPlugins.js"

const mockPlugin = createPlugin(() => {
	return {
		id: "mock.plugin",
		config: () => {
			return {
				languages: ["en", "de"],
			}
		},
	}
})

it("should define plugins as an empty array if no plugins are defined", async () => {
	const config = await setupPlugins({
		config: {},
		env: {} as any,
	})
	expect(config.plugins).toEqual([])
})

it("should be possible to define a config with plugins", async () => {
	const config = await setupPlugins({
		config: {
			referenceLanguage: "de",
			plugins: [mockPlugin()],
		},
		env: {} as any,
	})
	expect(config.referenceLanguage).toEqual("de")
	expect(config.plugins[0]!.id).toEqual("mock.plugin")
	expect(config.languages).toEqual(["en", "de"])
})

// Plugins are unaware of each other, so it's possible to define the same
// language in multiple plugins. This is not a problem, but the languages
// should be merged without duplicates.
it("should merge languages without duplicates", async () => {
	const config = await setupPlugins({
		config: {
			languages: ["fr", "nl", "en"],
			plugins: [mockPlugin()],
		},
		env: {} as any,
	})
	expect(config.languages).toEqual(["fr", "nl", "en", "de"])
})

it("should not fail if one plugin crashes", async () => {
	vi.spyOn(console, "error").mockImplementation(() => undefined)

	const config = await setupPlugins({
		config: {
			plugins: [
				mockPlugin(),
				{
					id: "crashing.plugin",
					config: () => {
						throw new Error("Plugin crashed")
					},
				},
			],
		},
		env: {} as any,
	})
	expect(config.languages).toEqual(["en", "de"])
	expect(console.error).toHaveBeenCalledTimes(1)
})
