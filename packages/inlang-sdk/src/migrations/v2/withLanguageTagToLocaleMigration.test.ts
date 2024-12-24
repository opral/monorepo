import { expect, test } from "vitest";
import type { ProjectSettings } from "../../json-schema/settings.js";
import { withLanguageTagToLocaleMigration } from "./withLanguageTagToLocaleMigration.js";

test("it should set sourceLanguageTag and languageTags if non-existent to make v1 plugins work", async () => {
	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
	};

	const withMigration = withLanguageTagToLocaleMigration(settings);

	expect(withMigration.baseLocale).toBe("en");
	expect(withMigration.sourceLanguageTag).toBe("en");
	expect(withMigration.locales).toEqual(["en", "de"]);
	expect(withMigration.languageTags).toEqual(["en", "de"]);
});

test("it should set baseLocale and locales if non-existent to ensure first load of an old project works", async () => {
	const settings: ProjectSettings = {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
	} as ProjectSettings;

	const withMigration = withLanguageTagToLocaleMigration(settings);

	expect(withMigration.baseLocale).toBe("en");
	expect(withMigration.sourceLanguageTag).toBe("en");
	expect(withMigration.languageTags).toEqual(["en", "de"]);
	expect(withMigration.locales).toEqual(["en", "de"]);
});

/**
 * Users are expected to treat baseLocale and locales as the source of truth.
 * The alternative is complicated merging logic which is not worth the effort.
 */
test("it should treat baseLocale and locales as source of truth", async () => {
	const settings: ProjectSettings = {
		baseLocale: "de",
		locales: ["de", "en", "fr", "es"],
		sourceLanguageTag: "en",
		languageTags: ["en", "nl"],
	};

	const withMigration = withLanguageTagToLocaleMigration(settings);

	expect(withMigration.baseLocale).toBe("de");
	expect(withMigration.sourceLanguageTag).toBe("de");
	expect(withMigration.languageTags).toEqual(["de", "en", "fr", "es"]);
	expect(withMigration.locales).toEqual(["de", "en", "fr", "es"]);
});
