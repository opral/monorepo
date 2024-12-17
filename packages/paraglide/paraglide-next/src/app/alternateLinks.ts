import { availableLanguageTags, languageTag } from "$paraglide/runtime.js";
import { ResolvingMetadata } from "next";
import { RoutingStrategy } from "./index.client";
import { format } from "./utils/format";
import { addBasePath } from "./utils/basePath";

/**
 * Generates the metadata NextJS needs to generate the `<link rel="alternate"` headers.
 * Call this in your root-layout's `generateMetadata` function
 *
 * @example
 * ```ts
 * import { strategy } from "@/lib/i18n"
 * import { generateAlternateLinks } from "@inlang/paraglide-next"
 *
 * export function generateMetadata(props, parent) {
 *   return {
 *     alternates: {
 *       languages: generateAlternateLinks({
 *         origin: "https://example.com",
 *         strategy: strategy,
 *         resolvingMetadata: parent
 *       }),
 *     }
 *   }
 * }
 * ```
 */
export function generateAlternateLinks<T extends string>({
  origin,
  strategy,
  resolvingMetadata: parent,
}: {
  /**
   * The origin url at which the NextJS app is running
   */
  origin: `http${string}`;
  /**
   * The routing strategy
   */
  strategy: RoutingStrategy<T>;
  /**
   * The ResolvingMetadata. Get this from the second argument of `generateMetadata`
   */
  resolvingMetadata: ResolvingMetadata;
}): Record<string, string> {
  const pathname = illegallyGetPathname(parent);
  if (!pathname) return {};
  const locale = languageTag() as T;

  //current pathname, rendered per page
  const localisedPathname = new URL(pathname, "http://n.com")
    .pathname as `/${string}`;
  const canonicalPathname = strategy.getCanonicalPath(
    localisedPathname,
    locale,
  );

  const alternateLinks = Object.fromEntries(
    (availableLanguageTags as readonly T[]).map((lang) => {
      const localisedUrl = strategy.getLocalisedUrl(
        canonicalPathname,
        lang,
        true,
      );
      const formatted = format(localisedUrl);
      const withBase = formatted.startsWith("/")
        ? addBasePath(formatted, true)
        : formatted;
      const href = new URL(withBase, origin).href;
      return [lang, href];
    }),
  );

  const hrefsAreUnique =
    new Set(Object.values(alternateLinks)).size ===
    Object.values(alternateLinks).length;

  return hrefsAreUnique ? alternateLinks : {};
}

function illegallyGetPathname(parent: ResolvingMetadata): string | undefined {
  type NextInternalRouteData = {
    urlPathname: string;
  };

  const routeData = Object.getOwnPropertySymbols(parent)
    .map((symbol) => (parent as any)[symbol])
    .filter((thing) => typeof thing === "object")
    .filter((thing): thing is NextInternalRouteData => "urlPathname" in thing)
    .at(0);

  if (!routeData) return undefined;
  else return routeData.urlPathname;
}
