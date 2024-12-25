import { describe, it, expect } from "vitest";
import { detectLanguageFromPath } from "./detectLanguage.js";

describe("detectLanguage", () => {
	it("should detect the language from the path", () => {
		expect(
			detectLanguageFromPath({
				path: "/de/ueber-uns",
				availableLanguageTags: ["de", "en"],
			})
		).toBe("de");
	});

	it("should return undefined if the path is not in the base path", () => {
		expect(
			detectLanguageFromPath({
				path: "/de/ueber-uns",
				base: "/base",
				availableLanguageTags: ["de", "en"],
			})
		).toBe(undefined);
	});

	it("should return undefined if the language is not available", () => {
		expect(
			detectLanguageFromPath({
				path: "/de/ueber-uns",
				availableLanguageTags: ["en"],
			})
		).toBe(undefined);
	});

	it("should detect the language if a base path is given", () => {
		expect(
			detectLanguageFromPath({
				path: "/base/de/ueber-uns",
				base: "/base",
				availableLanguageTags: ["de", "en"],
			})
		).toBe("de");
	});

	it("should detect the language if the base-path is /", () => {
		expect(
			detectLanguageFromPath({
				path: "/de/ueber-uns",
				base: "/",
				availableLanguageTags: ["de", "en"],
			})
		).toBe("de");
	});
});
