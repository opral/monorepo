import { describe, it, expect } from "vitest"
import { createI18n } from "./adapter"
import { base } from "$app/paths"
//@ts-ignore
import * as runtime from "$paraglide/runtime.js"

describe("createI18n", () => {
	it("resolves routes", () => {
		const i18n = createI18n(runtime)

		//don't prefix the default language
		expect(i18n.resolveRoute(base + "/about", "en")).toBe(base + "/about")
		expect(i18n.resolveRoute(base + "/about", "de")).toBe(base + "/de/about")
	})

	it("get's the canonical route from a localised path", () => {
		const i18n = createI18n(runtime)

		expect(i18n.route(base + "/about")).toBe(base + "/about")
		expect(i18n.route(base + "/de/about")).toBe(base + "/about")
	})
})
