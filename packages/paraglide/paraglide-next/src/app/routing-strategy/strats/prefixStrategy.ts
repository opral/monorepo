import {
  PathDefinitionTranslations,
  validatePathTranslations,
  resolveRoute,
  bestMatch,
  prettyPrintPathDefinitionIssues,
  UserPathDefinitionTranslations,
  resolveUserPathDefinitions,
} from "@inlang/paraglide-js/internal/adapter-utils";
import type { RoutingStrategy } from "../interface";
import { DEV } from "../../env";
import { rsc } from "rsc-env";
import {
  availableLanguageTags,
  sourceLanguageTag,
} from "$paraglide/runtime.js";

/*
	Lingo:
	Canonical Path = Path without locale (how you write the href)
	Localised Path = Path with locale (how the path is visible in the URL bar)
*/

export function PrefixStrategy<T extends string>({
  pathnames: userPathnames,
  exclude,
  prefixDefault,
  prefixes,
}: {
  exclude?: (path: string) => boolean;
  pathnames?: UserPathDefinitionTranslations<T>;
  /**
   * If the default language should be included in the URL
   *
   * @example
   * ```txt
   * prefixDefault: "always", /en/some/path -> en
   * prefixDefault: "always", /some-path -> ?
   * prefixDefault: "never", /some-path -> en
   * ```
   *
   * @default "never"
   *
   */
  prefixDefault?: "always" | "never";

  /**
   * Custom language prefixes
   * Do not include slashes in the prefixes
   *
   * @example
   * ```ts
   * prefixes: {
   *   "de-CH": "ch",
   *   "en-US": "us",
   * }
   * ```
   */
  prefixes?: {
    [key in T]?: string;
  };
} = {}): RoutingStrategy<T> {
  const resolvedPathnames = /** @__PURE__ */ userPathnames
    ? resolveUserPathDefinitions(userPathnames, availableLanguageTags)
    : {};

  const resolvedPrefixes = {
    ...(Object.fromEntries(
      availableLanguageTags.map((lang) => [lang, lang]),
    ) as Record<T, string>),
    ...prefixes,
  };

  if (DEV) {
    const withSlashes = Object.values(resolvedPrefixes).filter(
      (val) => typeof val === "string" && val.includes("/"),
    );
    if (withSlashes.length) {
      throw new Error(
        [
          "[parglide-sveltekit:dev-only] Prefixes on cannot include slashes.",
          ...withSlashes,
        ].join("\n"),
      );
    }

    const paths = Object.values(resolvedPathnames);
    const hasDuplicates = new Set(paths).size !== paths.length;
    if (hasDuplicates) {
      throw new Error(
        "[parglide-sveltekit:dev-only] `prefixes` must be unique.",
      );
    }
  }

  prefixDefault ??= "never";

  // Make sure the given pathnames are valid during dev
  // middleware is not rsc so validating there guarantees this will run once
  if (DEV && !rsc) {
    const issues = validatePathTranslations(
      resolvedPathnames,
      availableLanguageTags as T[],
      {},
    );
    if (issues.length) {
      console.warn(
        "Issues were found with your pathnames. Fix them before deploying:\n\n" +
          prettyPrintPathDefinitionIssues(issues),
      );
    }
  }

  function getCanonicalPath(
    localisedPath: `/${string}`,
    locale: T,
  ): `/${string}` {
    // get the prefix for this language
    const prefix = resolvedPrefixes[locale] ?? locale;

    const pathWithoutLocale: `/${string}` = localisedPath.startsWith(
      `/${prefix}/`,
    )
      ? (localisedPath.replace(`/${prefix}`, "") as `/${string}`)
      : localisedPath === `/${prefix}`
        ? "/"
        : localisedPath;

    for (const [canonicalPathDefinition, translationsForPath] of Object.entries(
      resolvedPathnames,
    )) {
      if (!(locale in translationsForPath)) continue;

      const translatedPathDefinition = translationsForPath[locale];
      if (!translatedPathDefinition) continue;

      const match = bestMatch(
        pathWithoutLocale,
        [translatedPathDefinition],
        {},
      );
      if (!match) continue;

      return resolveRoute(
        canonicalPathDefinition,
        match.params,
      ) as `/${string}`;
    }

    return pathWithoutLocale;
  }

  function getTranslatedPath(
    canonicalPath: `/${string}`,
    lang: T,
    translations: PathDefinitionTranslations<T>,
  ): `/${string}` {
    const match = bestMatch(canonicalPath, Object.keys(translations), {});
    if (!match) return canonicalPath;

    const translationsForPath = translations[match.id as `/${string}`];
    if (!translationsForPath) return canonicalPath;

    const translatedPath = translationsForPath[lang];
    if (!translatedPath) return canonicalPath;

    return resolveRoute(translatedPath, match.params) as `/${string}`;
  }

  return {
    getLocalisedUrl(canonicalPath, targetLanguage) {
      if (exclude && exclude(canonicalPath))
        return {
          pathname: canonicalPath,
        };

      const translatedPath = getTranslatedPath(
        canonicalPath,
        targetLanguage,
        resolvedPathnames,
      );
      const shouldAddPrefix =
        targetLanguage !== sourceLanguageTag || prefixDefault === "always";

      const prefix = resolvedPrefixes[targetLanguage] ?? targetLanguage;

      const localisedPath: `/${string}` = shouldAddPrefix
        ? `/${prefix}${translatedPath == "/" ? "" : translatedPath}`
        : translatedPath;
      return {
        pathname: localisedPath,
      };
    },
    getCanonicalPath,

    resolveLocale(request) {
      const pathWithoutBase = request.nextUrl.pathname;

      const entries = Object.entries(resolvedPrefixes) as [T, string][];
      const entry = entries.find(
        ([, prefix]) =>
          pathWithoutBase.startsWith(`/${prefix}/`) ||
          pathWithoutBase === `/${prefix}`,
      );
      const detected = entry?.[0];

      // If no prefix is detected and prefixDefault is "never" -> use default language
      // Otherwise leave it ambiguous
      if (prefixDefault === "never")
        return detected || (sourceLanguageTag as T);
      return detected;
    },
  };
}
