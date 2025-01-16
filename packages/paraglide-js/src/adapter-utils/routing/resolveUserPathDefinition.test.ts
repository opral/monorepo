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
		const availableLocales = ["en", "de"] as const;
		const result = resolveUserPathDefinitions(
			userTranslations,
			availableLocales
		);
		expect(result).toEqual(userTranslations);
	});

	it("resolves message translations", () => {
		const userTranslations: UserPathDefinitionTranslations<"en" | "de"> = {
			"/about": (_: any, { locale }: { locale: "en" | "de" }) => {
				switch (locale) {
					case "en":
						return "/about";
					case "de":
						return "/ueber-uns";
				}
			},
		};

		const availableLocales = ["en", "de"] as const;
		const result = resolveUserPathDefinitions(
			userTranslations,
			availableLocales
		);
		expect(result).toEqual({
			"/about": {
				en: "/about",
				de: "/ueber-uns",
			},
		});
	});
});
