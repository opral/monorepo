import type { NextRequest } from "next/server";
import { RoutingStrategy } from "../routing-strategy/interface";
import { addPathPrefix } from "../utils/basePath";
import { format } from "../utils/format";

/**
 * Adds SEO headers
 */
export function addSeoHeaders<T extends string>(
  headers: Headers,
  {
    canonicalPath,
    availableLanguageTags,
    request,
    strategy,
  }: {
    canonicalPath: `/${string}`;
    availableLanguageTags: readonly T[];
    request: NextRequest;
    strategy: RoutingStrategy<T>;
  },
) {
  if (!isPageRequest(request)) return;
  if (availableLanguageTags.length <= 1) return;
  const nextUrl = request.nextUrl;

  const alternateLinks = Object.fromEntries(
    availableLanguageTags.map((lang) => {
      const localizedUrl = strategy.getLocalisedUrl(canonicalPath, lang, true);
      localizedUrl.pathname = encodeURI(
        localizedUrl.pathname || "/",
      ) as `/${string}`;
      localizedUrl.pathname = addPathPrefix(
        localizedUrl.pathname,
        nextUrl.basePath,
      ) as `/${string}`;

      localizedUrl.protocol ??= nextUrl.protocol;
      localizedUrl.host ??= nextUrl.host;
      localizedUrl.hostname ??= nextUrl.hostname;
      localizedUrl.port ??= nextUrl.port;
      localizedUrl.hash ??= nextUrl.hash;
      localizedUrl.search ??= nextUrl.search;

      const fullHref = format(localizedUrl);
      return [lang, fullHref];
    }),
  ) as Record<T, string>;

  // make sure the links are unique
  const linksAreUnique =
    new Set(Object.values(alternateLinks)).size ===
    Object.keys(alternateLinks).length;

  if (linksAreUnique) {
    const linkHeader = Object.entries(alternateLinks)
      .map(([lang, href]) => `<${href}>; rel="alternate"; hreflang="${lang}"`)
      .join(", ");
    headers.set("Link", linkHeader);
    return;
  } else {
    // Vary based on cookies and accept header
    headers.set("Vary", "Cookie, Accept-Language");
    return;
  }
}

/**
 * Checks if the given request is for a page
 */
function isPageRequest(request: NextRequest) {
  const acceptHeader = request.headers.get("accept");
  return acceptHeader?.includes("text/html");
}
