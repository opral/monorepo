import { describe, expect, test } from "vitest";
import {
  buildDocMaps,
  buildTocMap,
  normalizeRelativePath,
  slugifyFileName,
  slugifyRelativePath,
} from "./build-doc-map";

describe("buildDocMaps", () => {
  test("creates slug records from markdown frontmatter", () => {
    const { bySlug } = buildDocMaps({
      "/content/docs/guide/hello-world.md": `---
slug: hello-doc
title: Hello World
description: Sample doc
---

# Hello world`,
      "/content/docs/reference/api.md": `---
title: API
---

API contents`,
    });

    expect(bySlug["hello-doc"].relativePath).toBe("./guide/hello-world.md");
    expect(bySlug["api"].relativePath).toBe("./reference/api.md");
  });
});

describe("buildTocMap", () => {
  test("normalizes relative file paths", () => {
    const tocMap = buildTocMap({
      sidebar: [
        {
          label: "Overview",
          items: [
            { file: "./what-is-lix.md", label: "What is Lix?" },
            { file: "/content/docs/guide/setup.md", label: "Setup" },
          ],
        },
      ],
    });

    expect(tocMap.get("./what-is-lix.md")?.label).toBe("What is Lix?");
    expect(tocMap.get("./guide/setup.md")?.label).toBe("Setup");
  });
});

describe("path helpers", () => {
  test("normalizeRelativePath removes content/docs prefix", () => {
    expect(normalizeRelativePath("/content/docs/guide/setup.md")).toBe(
      "./guide/setup.md",
    );
  });

  test("slugifyRelativePath flattens path into url safe slug", () => {
    expect(slugifyRelativePath("./guide/hello-world.md")).toBe(
      "guide-hello-world",
    );
  });

  test("slugifyFileName uses the filename without extension", () => {
    expect(slugifyFileName("./guide/hello-world.md")).toBe("hello-world");
  });
});
