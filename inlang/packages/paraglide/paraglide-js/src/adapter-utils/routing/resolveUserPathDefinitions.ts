import type { MessageBundleFunction } from "../../compiler/types.js";
import type { PathDefinitionTranslations } from "./routeDefinitions.js";

/**
 * Maps canonical paths to translations for each language.
 *
 * @example
 * ```json
 * {
 *   "/": {
 *    "en": "/",
 *    "de": "/de"
 *   },
 *   "/about": {
 *     "en": "/about",
 *     "de": "/ueber-uns"
 *   },
 *   "/admin/users/[id]": {
 *     "en": "/admin/users/[id]",
 *     "de": "/admin/benutzer/[id]"
 *   }
 * }
 * ```
 */
export type UserPathDefinitionTranslations<T extends string = string> = {
	[canonicalPath: `/${string}`]:
		| Record<T, `/${string}`>
		| MessageBundleFunction<T>;
};

/**
 * For UX purpouses we let users pass messages as pathnames.
 *
 * Fully resolves all path translations.
 * If a path translation is a message-function, it will be evaluated for each language.
 *
 * Does NOT perform any validation on if the user-provided path translation configuration is valid.
 *
 * @param userTranslations The user-provided path translation configuration.
 * @param availableLocales The available language tags.
 * @returns The resolved path translations.
 */
export const resolveUserPathDefinitions = <T extends string>(
	userTranslations: UserPathDefinitionTranslations<T>,
	availableLocales: readonly T[]
): PathDefinitionTranslations<T> =>
	Object.fromEntries(
		Object.entries(userTranslations).map(([path, translation]) => [
			path,
			typeof translation === "object"
				? translation
				: fromMessage(translation, availableLocales),
		])
	);

const fromMessage = <T extends string>(
	message: MessageBundleFunction<T>,
	availableLocales: readonly T[]
) =>
	Object.fromEntries(
		availableLocales.map((locale) => [locale, message({}, { locale })])
	) as Record<T, `/${string}`>;
