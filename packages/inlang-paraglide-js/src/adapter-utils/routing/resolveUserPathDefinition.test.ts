import { describe, it, expect } from "vitest";
import {
	resolveUserPathDefinitions,
	type UserPathDefinitionTranslations,
} from "./resolveUserPathDefinitions.js";

describe("resolvePathTranslations", () => {
	it("leaves object translations as is", () => {
		const userTranslations: UserPathDefinitionTranslations<"en" | "de"> = {
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		};
		const availableLanguageTags = ["en", "de"] as const;
		const result = resolveUserPathDefinitions(
			userTranslations,
			availableLanguageTags
		);
		expect(result).toEqual(userTranslations);
	});

	it("resolves message translations", () => {
		const userTranslations: UserPathDefinitionTranslations<"en" | "de"> = {
			"/about": (_, { languageTag }: { languageTag: "en" | "de" }) => {
				switch (languageTag) {
					case "en":
						return "/about";
					case "de":
						return "/ueber-uns";
				}
			},
		};

		const availableLanguageTags = ["en", "de"] as const;
		const result = resolveUserPathDefinitions(
			userTranslations,
			availableLanguageTags
		);
		expect(result).toEqual({
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		});
	});
});
