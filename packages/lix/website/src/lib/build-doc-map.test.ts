import { describe, expect, test } from "vitest";
import {
  buildDocMaps,
  buildTocMap,
  normalizeRelativePath,
  parseSlugId,
  slugifyRelativePath,
} from "./build-doc-map";

describe("buildDocMaps", () => {
  test("creates slug-with-id records from markdown frontmatter", () => {
    const { byId, bySlugId } = buildDocMaps({
      "/content/docs/guide/hello-world.md": `---
id: abc123
title: Hello World
description: Sample doc
---

# Hello world`,
      "/content/docs/reference/api.md": `---
id: def456
---

API contents`,
    });

    expect(byId.abc123.slugWithId).toBe("guide-hello-world-abc123");
    expect(byId.abc123.relativePath).toBe("./guide/hello-world.md");
    expect(byId.abc123.title).toBe("Hello World");
    expect(bySlugId["guide-hello-world-abc123"]).toBe(byId.abc123);

    expect(byId.def456.slugWithId).toBe("reference-api-def456");
    expect(byId.def456.description).toBeUndefined();
  });

  test("throws when frontmatter id is missing", () => {
    expect(() =>
      buildDocMaps({
        "/content/docs/missing-id.md": `---
title: Missing id
---

No id here`,
      }),
    ).toThrow(/Missing required "id" frontmatter/);
  });
});

describe("buildTocMap", () => {
  test("normalizes relative file paths", () => {
    const tocMap = buildTocMap({
      sidebar: [
        {
          label: "Overview",
          items: [
            { file: "./hello.md", label: "Hello" },
            { file: "/content/docs/guide/setup.md", label: "Setup" },
          ],
        },
      ],
    });

    expect(tocMap.get("./hello.md")?.label).toBe("Hello");
    expect(tocMap.get("./guide/setup.md")?.label).toBe("Setup");
  });
});

describe("parseSlugId", () => {
  test("splits slug and id", () => {
    expect(parseSlugId("hello-123")).toEqual({
      slugBase: "hello",
      id: "123",
      slugWithId: "hello-123",
    });
  });

  test("returns null for invalid input", () => {
    expect(parseSlugId("noid")).toBeNull();
    expect(parseSlugId("-bad")).toBeNull();
  });
});

describe("path helpers", () => {
  test("normalizeRelativePath removes content/docs prefix", () => {
    expect(normalizeRelativePath("/content/docs/guide/hello.md")).toBe(
      "./guide/hello.md",
    );
  });

  test("slugifyRelativePath flattens path into url safe slug", () => {
    expect(slugifyRelativePath("./guide/hello-world.md")).toBe(
      "guide-hello-world",
    );
  });
});
