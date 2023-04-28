import { describe, it } from "vitest"
import { transformSvelte } from "./*.svelte.js"
import { baseTestConfig } from "./test-helpers/config.js"
import type { TransformConfig } from "../config.js"
import { readFileSync } from "node:fs"

const testSvelteFile = readFileSync(__dirname + "/test-helpers/test.svelte").toString()
describe("transformSvelte", () => {
	it("languageInUrl is true", ({ expect }) => {
		const config: TransformConfig = {
			...baseTestConfig,
			languageInUrl: true,
		}
		const code = transformSvelte(config, testSvelteFile)
		expect(code).toMatchSnapshot()
	})

	it("languageInUrl is false", ({ expect }) => {
		const code = transformSvelte(baseTestConfig, testSvelteFile)
		expect(code).toMatchSnapshot()
	})
})
