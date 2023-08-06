import { pluginBuildConfig } from "./pluginBuildConfig.js"
import { describe, it, expect } from "vitest"

describe("pluginBuildConfig", () => {
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

	it("should not be possible to pass properties defined by inlang", async () => {
		await expect(
			pluginBuildConfig({
				entryPoints: ["a"],
				// @ts-expect-error
				bundle: true,
				platform: "neutral",
				format: "esm",
			}),
		).rejects.toThrow()
	})

	it("should set default properties when not provided", async () => {
		const options = await pluginBuildConfig({
			entryPoints: ["a"],
		})

		expect(options.bundle).toBe(true)
		expect(options.platform).toBe("neutral")
		expect(options.format).toBe("esm")
		expect(options.target).toBe("es2020")
		expect(options.external).toEqual(["@esbuild-plugins/node-modules-polyfill", "ts-dedent"])
	})

	it("should correctly add external plugins", async () => {
		const options = await pluginBuildConfig({
			entryPoints: ["a"],
			external: ["other-plugin"],
		})

		expect(options.external).toEqual(["other-plugin", "@esbuild-plugins/node-modules-polyfill", "ts-dedent"])
	})
})