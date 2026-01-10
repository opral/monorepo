import { describe, it, expect } from "vitest";
import { resolveOgImageUrl } from "./og-image";

describe("resolveOgImageUrl", () => {
  it("returns absolute URLs unchanged", () => {
    expect(
      resolveOgImageUrl("https://example.com/og.png", "my-post"),
    ).toBe("https://example.com/og.png");
  });

  it("resolves relative URLs against the blog slug", () => {
    expect(resolveOgImageUrl("./assets/banner.svg", "my-post")).toBe(
      "https://inlang.com/blog/my-post/assets/banner.svg",
    );
  });
});
