import { expect, it } from "vitest"
import { mockEnvironment } from "./mockEnvironment.js"
import { testConfigFile } from "./testConfigFile.js"

const env = await mockEnvironment({})

it("should error on import keywords", async () => {
	const shouldFail1 = `
    import { x } from "y"
  `
	const shouldFail2 = `
    export function defineConfig(env) {
      const butThisFails = import("x")
    }
  `
	const [, exception1] = await testConfigFile({ file: shouldFail1, env })
	expect(exception1).toBeDefined()
	const [, exception2] = await testConfigFile({ file: shouldFail2, env })
	expect(exception2).toBeDefined()
})

it("should allow $import statements", async () => {
	const shouldPass = `
    export function defineConfig(env) {
      const shouldPass = env.$import("x").catch(() => undefined)

      return {
        referenceLanguage: "en",
        languages: ["en"],
        readResources: () => [{ type: "Resource", languageTag: { type: "LanguageTag", name: "en" }, body: [] }],
        writeResources: () => undefined,
      }
    }
  `
	const [, exception] = await testConfigFile({ file: shouldPass, env })
	expect(exception).not.toBeDefined()
})

it("should allow JSDoc import statements", async () => {
	const shouldPass = `
    /**
     * @type { import("@inlang/core/config").DefineConfig }
     */
    export function defineConfig(env) {
      const shouldPass = env.$import("x").catch(() => undefined)

      return {
        referenceLanguage: "en",
        languages: ["en"],
        readResources: () => [{ type: "Resource", languageTag: { type: "LanguageTag", name: "en" }, body: [] }],
        writeResources: () => undefined,
      }
    }
  `
	const [, exception] = await testConfigFile({ file: shouldPass, env })
	expect(exception).not.toBeDefined()
})
