// polyfill for node:url's format as it is not available in Next-production mode
import type { UrlObject } from "node:url";
import { stringify as stringifyQS } from "qs";

// for which values of "protocol" slashes should be added
// also add slashes for an empty protocol
const slashedProtocols: readonly string[] = [
  "http:",
  "https:",
  "ftp:",
  "gopher:",
  "file:",
  "",
];

export function format(url: UrlObject): string {
  const protocol = url.protocol
    ? url.protocol.endsWith(":")
      ? url.protocol
      : url.protocol + ":"
    : "";

  const auth = url.auth
    ? `${encodeURIComponent(url.auth).replace(/%3A/i, ":")}@`
    : "";
  let host: string | undefined = url.host
    ? auth + url.host
    : url.hostname
      ? auth +
        //escape ipv6 addresses with brackets
        (!url.hostname.includes(":") ? url.hostname : `[${url.hostname}]`) +
        (url.port ? `:${url.port}` : "")
      : undefined;

  let pathname = url.pathname || "";

  /*
   * only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
   * Also, if there is no protocol then it is implicitly slashed
   */
  if (
    url.slashes ||
    (slashedProtocols.includes(protocol) && host !== undefined)
  ) {
    host = `//${host}`;

    //only make the path absolute here since we only know here that it's not the first thing in the URL
    if (pathname && !pathname.startsWith("/")) pathname = `/${pathname}`;
  }

  const escapedPathname = pathname.replace(/[?#]/g, encodeURIComponent);

  let query = "";
  if (
    url.query &&
    typeof url.query === "object" &&
    Object.keys(url.query).length
  ) {
    query = stringifyQS(url.query, {
      arrayFormat: "repeat",
      addQueryPrefix: false,
    });
  }

  const search = // if there is a search, use it
    (
      url.search
        ? url.search.startsWith("?")
          ? url.search
          : `?${url.search}`
        : // if there is instead a query string, use it
          query
          ? `?${query}`
          : // otherwise fall back to nothing
            ""
    ).replace("#", "%23");

  const hash = url.hash
    ? url.hash.startsWith("#")
      ? url.hash
      : `#${url.hash}`
    : "";
  return protocol + (host || "") + escapedPathname + search + hash;
}
