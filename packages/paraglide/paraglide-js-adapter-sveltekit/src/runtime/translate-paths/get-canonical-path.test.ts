import { describe, expect, it, vi } from "vitest"
import { getCanonicalPath } from "./get-canonical-path"

vi.mock("$app/paths", () => {
	return { base: "/base/" }
})

describe("getCanonicalPath", () => {
	it("removes the language ", () => {
		const canonical = getCanonicalPath("/base/de", {})
		expect(canonical).toBe("/base")
	})

	it("keeps paths", () => {
		const canonical = getCanonicalPath("/base/de/about", {})
		expect(canonical).toBe("/base/about")
	})

	it("applies translations according to the language paths", () => {
		const canonical = getCanonicalPath("/base/de/ueber-uns", {
			"/about": {
				en: "/about",
				de: "/ueber-uns",
				fr: "/a-propos",
			},
		})
		expect(canonical).toBe("/base/about")
	})

	it("applies translations according to the language paths", () => {
		const canonical = getCanonicalPath("/base/fr/a-propos", {
			"/about": {
				en: "/about",
				de: "/ueber-uns",
				fr: "/a-propos",
			},
		})
		expect(canonical).toBe("/base/about")
	})
})

vi.resetAllMocks()
