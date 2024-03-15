import { describe, it, expect } from "vitest"
import { createI18n } from "./adapter"
import { base } from "$app/paths"
//@ts-ignore
import * as runtime from "$paraglide/runtime.js"

describe("createI18n", () => {
	describe("resolveRoute", () => {
		it("resolves routes", () => {
			const i18n = createI18n(runtime)

			//don't prefix the default language
			expect(i18n.resolveRoute(base + "/about", "en")).toBe(base + "/about")
			expect(i18n.resolveRoute(base + "/about", "de")).toBe(base + "/de/about")
		})

		it("uses pathnames", () => {
			const i18n = createI18n(runtime, {
				pathnames: {
					"/about": {
						en: "/about",
						de: "/ueber-uns",
					},
				},
			})

			expect(i18n.resolveRoute(base + "/about", "en")).toBe(base + "/about")
			expect(i18n.resolveRoute(base + "/about", "de")).toBe(base + "/de/ueber-uns")
		})

		it.skipIf(base === "")("leaves the path as is if it doen't start with the base path", () => {
			const i18n = createI18n(runtime)

			expect(i18n.resolveRoute("/about", "en")).toBe("/about")
			expect(i18n.resolveRoute("/about", "de")).toBe("/about")
		})

		it("leaves the path as is if it's excluded", () => {
			const i18n = createI18n(runtime, {
				exclude: [base + "/about"],
			})

			expect(i18n.resolveRoute(base + "/about", "en")).toBe(base + "/about")
			expect(i18n.resolveRoute(base + "/about", "de")).toBe(base + "/about")
		})
	})

	describe("route", () => {
		it("get's the canonical route from a localised path", () => {
			const i18n = createI18n(runtime)

			expect(i18n.route(base + "/about")).toBe(base + "/about")
			expect(i18n.route(base + "/de/about")).toBe(base + "/about")
		})

		it("uses pathnames", () => {
			const i18n = createI18n(runtime, {
				pathnames: {
					"/about": {
						en: "/about",
						de: "/ueber-uns",
					},
				},
			})

			expect(i18n.route(base + "/about")).toBe(base + "/about")
			expect(i18n.route(base + "/de/ueber-uns")).toBe(base + "/about")
		})

		it("handles trailing slashes", () => {
			const i18n = createI18n(runtime)

			expect(i18n.route(base + "/about/")).toBe(base + "/about")
			expect(i18n.route(base + "/de/about/")).toBe(base + "/about")
		})
	})
})
