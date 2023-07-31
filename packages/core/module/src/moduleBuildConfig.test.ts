import { moduleBuildConfig } from "./moduleBuildConfig.js"
import { it, expect } from "vitest"

/**
 * The tests concern validation of the moduleBuildConfig function.
 *
 * Testing every little property that is defined by the function like
 * `bundle` or `platform` seems unnecessary.
 */

it("should throw an error if entrypoints is undefined", () => {
	expect(moduleBuildConfig({})).rejects.toThrow()
})

it("should throw an error if entrypoints is not a single element", async () => {
	await expect(moduleBuildConfig({ entryPoints: [] })).rejects.toThrow()
	await expect(moduleBuildConfig({ entryPoints: ["a", "b"] })).rejects.toThrow()
})

it("should not be possible to pass properties that the function defines itself", async () => {
	await expect(
		moduleBuildConfig({
			entryPoints: ["a"],
			// @ts-expect-error
			bundle: false,
			platform: "browser",
			format: "cjs",
		}),
	).rejects.toThrow()
})
