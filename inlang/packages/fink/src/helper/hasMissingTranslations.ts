import { NewBundleNested } from "@inlang/sdk";

export const hasMissingTranslations = (
	bundle: NewBundleNested,
	relevantLocales: string[]
): boolean => {
	return (
		hasMissingLocales(bundle, relevantLocales) || hasEmptyPattern(bundle, relevantLocales)
	);
};

export default hasMissingTranslations;

// Check if pattern is empty
const hasEmptyPattern = (bundle: NewBundleNested, relevantLocales: string[]): boolean =>
	bundle.messages.some(
		(message) =>
			relevantLocales.includes(message.locale) &&
			message.variants.some(
				(variant) => variant.pattern === undefined || variant.pattern.length === 0
			)
	);

// Check if any relevant locale is missing from the bundle
const hasMissingLocales = (bundle: NewBundleNested, relevantLocales: string[]): boolean =>
	relevantLocales.some(
		(locale) => !bundle.messages.some((message) => message.locale === locale)
	);
