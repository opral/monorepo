import { describe, expect, test } from "vitest"
import type { TransformConfig } from '../config.js'
import { transformLayoutJs } from "./+layout.js.js"

describe("+layout.js.ts", () => {
	const baseConfig = {
		isStatic: true,
		srcFolder: "",
		rootRoutesFolder: "",
		hasAlreadyBeenInitialized: true,
		languageInUrl: false,
		tsCompilerOptions: {},
		sourceFileName: "",
		sourceMapName: "",
	} satisfies TransformConfig
	const requiredImports = `import { localStorageKey } from "@inlang/sdk-js/adapter-sveltekit/client/reactive";
import { initLocalStorageDetector, navigatorDetector } from "@inlang/sdk-js/detectors/client";
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared";
import { browser } from "$app/environment";`
	test("Insert into empty file with no options", () => {
		const code = ""
		const config = {
			...baseConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutJs(config, code, true)
		const expected = `${requiredImports}
export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});`
		expect(transformed).toBe(expected)
	})
	test("Insert into empty file with options", () => {
		const code = ""
		const config = {
			...baseConfig,
			languageInUrl: false,
		}
		const transformed = transformLayoutJs(config, code, true)
		const expected = `${requiredImports}
export const load = initRootLayoutLoadWrapper({
  initDetectors: browser
  ? () => [initLocalStorageDetector(localStorageKey), navigatorDetector]
  : undefined
}).wrap(async () => {});`
		expect(transformed).toBe(expected)
	})
	test("Wrap basic load function", () => {
		const code = `
export const load = async () => {};
		`
		const config = {
			...baseConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutJs(config, code, true)
		const expected = `${requiredImports}
export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});`
		expect(transformed).toBe(expected)
	})
	test("Wrap basic load function and merge incomplete imports", () => {
		const code = `
import { browser } from "$app/environment";
export const load = async () => {};
		`
		const config = {
			...baseConfig,
			languageInUrl: true,
		}
		const transformed = transformLayoutJs(config, code, true)
		const expected = `${requiredImports}
export const load = initRootLayoutLoadWrapper({}).wrap(async () => {});`
		expect(transformed).toBe(expected)
	})
})
