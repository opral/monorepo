import { BundleNested, ProjectSettings } from "@inlang/sdk2";

export const hasMissingTranslations = (
	bundle: BundleNested,
	filteredLocales: string[],
	settings: ProjectSettings
): boolean => {
	return (
		hasMissingLocales(bundle, filteredLocales, settings) ||
		hasEmptyPattern(bundle, filteredLocales, settings.baseLocale)
	);
};

export default hasMissingTranslations;

// check if pattern is empty
const hasEmptyPattern = (
	bundle: BundleNested,
	filteredLocales: string[],
	baseLocale: string
): boolean => {
	return bundle.messages.some((message) => {
		const isLocaleRelevant =
			filteredLocales.length > 0
				? [...filteredLocales, baseLocale].includes(message.locale)
				: true;

		return (
			isLocaleRelevant &&
			message.variants.some((variant) => variant.pattern.length === 0)
		);
	});
};

// check if filtered locale is missing or base locale is missing
const hasMissingFilteredLocales = (
	bundle: BundleNested,
	filteredLocales: string[],
	baseLocale: string
): boolean =>
	[...filteredLocales, baseLocale].some(
		(locale) => !bundle.messages.some((message) => message.locale === locale)
	);

// check if all locales are present
const hasMissingSettingsLocales = (
	bundle: BundleNested,
	locales: string[]
): boolean => {
	if (locales === undefined) return false;
	return locales.some(
		(locale) => !bundle.messages.some((message) => message.locale === locale)
	);
};

const hasMissingLocales = (
	bundle: BundleNested,
	filteredLocales: string[],
	settings: ProjectSettings
): boolean => {
	if (filteredLocales.length > 0) {
		// check if all locales and settings.baseLocale are present, else hasMissingLocale = true
		return hasMissingFilteredLocales(
			bundle,
			filteredLocales,
			settings.baseLocale
		);
	} else {
		// check if all settings?.locales are present, else hasMissingLocale = true
		return hasMissingSettingsLocales(bundle, settings.locales);
	}
};
