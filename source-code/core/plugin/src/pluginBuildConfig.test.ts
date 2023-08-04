import { pluginBuildConfig } from "./pluginBuildConfig.js"
import { it, expect } from "vitest"

/**
 * The tests concern validation of the pluginBuildConfig function.
 *
 * Testing every little property that is defined by the function like
 * `bundle` or `platform` seems unnecessary.
 */

it("should throw an error if entrypoints is undefined", () => {
	expect(pluginBuildConfig({})).rejects.toThrow()
})

it("should throw an error if entrypoints is not a single element", async () => {
	await expect(pluginBuildConfig({ entryPoints: [] })).rejects.toThrow()
	await expect(pluginBuildConfig({ entryPoints: ["a", "b"] })).rejects.toThrow()
})

it("should not be possible to pass properties that the function defines itself", async () => {
	await expect(
		pluginBuildConfig({
			entryPoints: ["a"],
			// @ts-expect-error
			bundle: false,
			platform: "browser",
			format: "cjs",
		}),
	).rejects.toThrow()
})
