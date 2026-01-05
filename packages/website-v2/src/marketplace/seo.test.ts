import { describe, it, expect } from "vitest";
import {
  buildMarketplaceTitle,
  deriveTitleFromPath,
  extractOgMeta,
  extractTwitterMeta,
  extractMarkdownH1,
  getMarketplaceSubpageTitle,
} from "./seo";

describe("marketplace seo helpers", () => {
  it("uses og:title first", () => {
    const title = getMarketplaceSubpageTitle({
      displayName: "Paraglide JS",
      pagePath: "/react-router",
      rawMarkdown: "# React Router",
      frontmatter: { "og:title": "Message Keys" },
    });

    expect(title).toBe("Message Keys");
  });

  it("uses h1 when frontmatter title is missing", () => {
    const title = getMarketplaceSubpageTitle({
      displayName: "Paraglide JS",
      pagePath: "/react-router",
      rawMarkdown: "# React Router\n\nContent",
    });

    expect(title).toBe("React Router");
  });

  it("uses path-derived title when no h1 is present", () => {
    const title = getMarketplaceSubpageTitle({
      displayName: "Paraglide JS",
      pagePath: "/react-router",
      rawMarkdown: "Content",
    });

    expect(title).toBe("React Router");
  });

  it("builds a nested page title with hyphen", () => {
    const title = buildMarketplaceTitle({
      displayName: "Paraglide JS",
      pagePath: "/message-keys",
      rawMarkdown: "Content",
      frontmatter: { "og:title": "Message Keys" },
    });

    expect(title).toBe("Paraglide JS - Message Keys | inlang");
  });

  it("builds a root page title without subpage", () => {
    const title = buildMarketplaceTitle({
      displayName: "Paraglide JS",
      pagePath: "/",
      rawMarkdown: "Content",
    });

    expect(title).toBe("Paraglide JS | inlang");
  });

  it("extracts first h1 after frontmatter", () => {
    const h1 = extractMarkdownH1(`---
title: Hello
---

# React Router

## Subhead
`);

    expect(h1).toBe("React Router");
  });

  it("derives title from path segments", () => {
    expect(deriveTitleFromPath("/next-js")).toBe("Next Js");
    expect(deriveTitleFromPath("/docs/react-router")).toBe("React Router");
  });

  it("extracts og meta entries from frontmatter", () => {
    const og = extractOgMeta({
      "og:title": "OG Title",
      "og:image": "https://example.com/og.png",
      title: "Ignored",
    });

    expect(og).toEqual([
      { name: "og:title", content: "OG Title" },
      { name: "og:image", content: "https://example.com/og.png" },
    ]);
  });

  it("extracts twitter meta entries from frontmatter", () => {
    const twitter = extractTwitterMeta({
      "twitter:title": "Twitter Title",
      "twitter:image": "https://example.com/twitter.png",
      title: "Ignored",
    });

    expect(twitter).toEqual([
      { name: "twitter:title", content: "Twitter Title" },
      { name: "twitter:image", content: "https://example.com/twitter.png" },
    ]);
  });
});
