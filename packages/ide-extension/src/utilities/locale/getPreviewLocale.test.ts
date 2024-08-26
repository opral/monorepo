import { describe, it, expect, vi } from "vitest"
import { getPreviewLocale } from "./getPreviewLocale.js"
import { state } from "../state.js"
import { getSetting } from "../settings/index.js"

// Mock the external modules directly
vi.mock("../state", () => ({
	state: vi.fn(),
}))

vi.mock("../settings/index", () => ({
	getSetting: vi.fn(),
}))

describe("getPreviewLocale", () => {
	it("returns the previewLanguageTag when it is available in project languages", async () => {
		// @ts-expect-error
		state.mockImplementation(() => ({
			project: {
				settings: () => ({
					baseLocale: "en",
					locales: ["en", "de"],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("de")
		expect(await getPreviewLocale()).toBe("de")
	})

	it("falls back to baseLocale when previewLanguageTag is not available", async () => {
		// @ts-expect-error
		state.mockImplementation(() => ({
			project: {
				settings: () => ({
					baseLocale: "en",
					locales: ["en"],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("fr")
		expect(await getPreviewLocale()).toBe("en")
	})

	it("uses baseLocale if previewLanguageTag is not set", async () => {
		// @ts-expect-error
		state.mockImplementation(() => ({
			project: {
				settings: () => ({
					baseLocale: "en",
					locales: ["en", "de"],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("")
		expect(await getPreviewLocale()).toBe("en")
	})

	it("handles undefined baseLocale gracefully", async () => {
		// @ts-expect-error
		state.mockImplementation(() => ({
			project: {
				settings: () => ({
					baseLocale: undefined,
					locales: [],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("de")
		expect(await getPreviewLocale()).toBeUndefined()
	})
})
