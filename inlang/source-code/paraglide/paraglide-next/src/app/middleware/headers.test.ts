import { describe, it, expect } from "vitest";
import { addSeoHeaders } from "./headers";
import { PrefixStrategy } from "../routing-strategy/strats/prefixStrategy";
import { NextRequest } from "next/server";
import { LINK_HEADER_NAME } from "../constants";
import { DetectionStrategy } from "../index.client";

describe("addSeoHeaders", () => {
  it("generates the Link header for a Routing Strategy with only pathnames", () => {
    const strategy = PrefixStrategy({
      pathnames: {},
      exclude: () => false,
      prefixDefault: "never",
    });

    const request = new NextRequest("https://example.com/base/some-page");
    request.nextUrl.basePath = "/base";
    request.headers.set("accept", "text/html");

    const headers = new Headers();
    addSeoHeaders(headers, {
      canonicalPath: "/",
      availableLanguageTags: ["en", "de", "fr"],
      request,
      strategy,
    });

    const linkHeader = headers.get(LINK_HEADER_NAME);
    expect(linkHeader).includes(
      '<https://example.com/base/de>; rel="alternate"; hreflang="de"',
    );
    expect(linkHeader).includes(
      '<https://example.com/base/fr>; rel="alternate"; hreflang="fr"',
    );
    expect(linkHeader).includes(
      '<https://example.com/base/>; rel="alternate"; hreflang="en"',
    );
  });

  it("varies based on Cookies if cookie strategy is used", () => {
    const strategy = DetectionStrategy();
    const request = new NextRequest("https://example.com/base/some-page");
    request.nextUrl.basePath = "/base";
    request.headers.set("accept", "text/html");

    const headers = new Headers();
    addSeoHeaders(headers, {
      canonicalPath: "/",
      availableLanguageTags: ["en", "de", "fr"],
      request,
      strategy,
    });

    const linkHeader = headers.get(LINK_HEADER_NAME);
    expect(linkHeader).toBeFalsy();

    const varyHeader = headers.get("vary");
    expect(varyHeader).includes("Accept-Language");
    expect(varyHeader).includes("Cookie");
  });

  it("doesn't add headers if the request is not a page", () => {
    const strategy = DetectionStrategy();
    const request = new NextRequest("https://example.com/api/some-page");
    request.headers.set("accept", "application/json");

    const headers = new Headers();
    addSeoHeaders(headers, {
      canonicalPath: "/",
      availableLanguageTags: ["en", "de", "fr"],
      request,
      strategy,
    });

    expect(headers.get(LINK_HEADER_NAME)).toBeFalsy();
    expect(headers.get("vary")).toBeFalsy();
  });
});
