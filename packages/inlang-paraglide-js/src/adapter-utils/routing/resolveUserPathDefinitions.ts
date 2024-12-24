import type { MessageIndexFunction } from "~/index.js";
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
    | MessageIndexFunction<T>;
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
 * @param availableLanguageTags The available language tags.
 * @returns The resolved path translations.
 */
export const resolveUserPathDefinitions = <T extends string>(
  userTranslations: UserPathDefinitionTranslations<T>,
  availableLanguageTags: readonly T[],
): PathDefinitionTranslations<T> =>
  Object.fromEntries(
    Object.entries(userTranslations).map(([path, translation]) => [
      path,
      typeof translation === "object"
        ? translation
        : fromMessage(translation, availableLanguageTags),
    ]),
  );

const fromMessage = <T extends string>(
  message: MessageIndexFunction<T>,
  availableLanguageTags: readonly T[],
) =>
  Object.fromEntries(
    availableLanguageTags.map((languageTag) => [
      languageTag,
      message({}, { languageTag }),
    ]),
  ) as Record<T, `/${string}`>;
