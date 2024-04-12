import { describe, it, expect, vi } from "vitest"
import { getPreviewLanguageTag } from "./getPreviewLanguageTag.js"
import { state } from "../state.js"
import { getSetting } from "../settings/index.js"

// Mock the external modules
vi.mock("../src/state")
vi.mock("../src/settings/index")

describe("getPreviewLanguageTag", () => {
	it("returns the previewLanguageTag when it is available in project languages", async () => {
		vi.mocked(state).mockImplementation(() => ({
			project: {
				// @ts-expect-error
				settings: () => ({
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("de")

		expect(await getPreviewLanguageTag()).toBe("de")
	})

	it("falls back to sourceLanguageTag when previewLanguageTag is not available", async () => {
		vi.mocked(state).mockImplementation(() => ({
			project: {
				// @ts-expect-error
				settings: () => ({
					sourceLanguageTag: "en",
					languageTags: ["en"],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("fr")

		expect(await getPreviewLanguageTag()).toBe("en")
	})

	it("uses sourceLanguageTag if previewLanguageTag is not set", async () => {
		vi.mocked(state).mockImplementation(() => ({
			project: {
				// @ts-expect-error
				settings: () => ({
					sourceLanguageTag: "en",
					languageTags: ["en", "de"],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("")

		expect(await getPreviewLanguageTag()).toBe("en")
	})

	it("handles undefined sourceLanguageTag gracefully", async () => {
		vi.mocked(state).mockImplementation(() => ({
			project: {
				settings: () => ({
					// @ts-expect-error
					sourceLanguageTag: undefined,
					languageTags: [],
				}),
			},
		}))
		vi.mocked(getSetting).mockResolvedValue("de")

		expect(await getPreviewLanguageTag()).toBeUndefined()
	})
})
