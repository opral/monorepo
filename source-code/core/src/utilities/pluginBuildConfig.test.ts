import { pluginBuildConfig } from "./pluginBuildConfig.js"
import { it, expect } from "vitest"

/**
 * The tests concern validation of the pluginBuildConfig function.
 *
 * Testing every little property that is defined by the function like
 * `bundle` or `platform` seems unnecessary.
 */

it("should throw an error if entrypoints is undefined", () => {
	expect(() => pluginBuildConfig({})).toThrow()
})

it("should throw an error if entrypoints is not a single element", () => {
	expect(() => pluginBuildConfig({ entryPoints: [] })).toThrow()
	expect(() => pluginBuildConfig({ entryPoints: ["a", "b"] })).toThrow()
})

it("should not be possible to pass properties that the function defines itself", () => {
	expect(() =>
		pluginBuildConfig({
			entryPoints: ["a"],
			// @ts-expect-error
			bundle: false,
			platform: "browser",
			format: "cjs",
		}),
	).toThrow()
})
