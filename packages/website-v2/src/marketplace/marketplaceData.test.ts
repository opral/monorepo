import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRegistry } = vi.hoisted(() => ({
  mockRegistry: [] as any[],
}));

vi.mock("@inlang/marketplace-registry", () => ({
  registry: mockRegistry,
}));

vi.mock("@tanstack/react-router", () => ({
  redirect: ({ to }: { to: string }) => {
    throw { to };
  },
}));

import { loadMarketplacePage } from "./marketplaceData";

describe("loadMarketplacePage redirects", () => {
  beforeEach(() => {
    mockRegistry.length = 0;
  });

  it("redirects to canonical slug for nested pages", async () => {
    mockRegistry.push({
      uniqueID: "u1",
      id: "app.example",
      slug: "my-app",
      readme: "https://example.com/readme.md",
    });

    await expect(
      loadMarketplacePage({
        uid: "u1",
        slug: "wrong-slug",
        splat: "docs/intro",
      })
    ).rejects.toMatchObject({
      to: "/m/u1/my-app/docs/intro",
    });
  });

  it("applies pageRedirects for nested docs", async () => {
    mockRegistry.push({
      uniqueID: "u1",
      id: "app.example",
      slug: "my-app",
      pageRedirects: {
        "/docs/*": "/guides/*",
      },
      readme: "https://example.com/readme.md",
    });

    await expect(
      loadMarketplacePage({
        uid: "u1",
        slug: "my-app",
        splat: "docs/old",
      })
    ).rejects.toMatchObject({
      to: "/m/u1/my-app/guides/old",
    });
  });

  it("redirects to id-based canonical slug when slug is missing", async () => {
    mockRegistry.push({
      uniqueID: "u2",
      id: "app.inlang.cli",
      readme: "https://example.com/readme.md",
    });

    await expect(
      loadMarketplacePage({
        uid: "u2",
        slug: "wrong-slug",
      })
    ).rejects.toMatchObject({
      to: "/m/u2/app-inlang-cli/",
    });
  });
});
