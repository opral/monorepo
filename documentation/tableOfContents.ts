import { RequiredFrontmatter } from "@inlang/website/src/services/markdown/index.js";

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter;

/**
 * The table of contents split by categories.
 */
export const tableOfContents: Record<string, string[]> = {
  Overview: [
    (await import("./introduction.md?raw")).default,
    (await import("./design-principles.md?raw")).default,
    (await import("./project-status.md?raw")).default,
    (await import("./code-organization.md?raw")).default,
    (await import("./the-next-git.md?raw")).default,
    (await import("../CONTRIBUTING.md?raw")).default,
  ],
  Guide: [
    (await import("./getting-started.md?raw")).default,
    (await import("./plugins.md?raw")).default,
    (await import("./build-on-inlang.md?raw")).default,
    (await import("./ci-cd.md?raw")).default,
  ],
  Reference: [
    (await import("./ast.md?raw")).default,
    (await import("./config.md?raw")).default,
    (await import("./environment-functions.md?raw")).default,
    (await import("./file-system.md?raw")).default,
    (await import("./query.md?raw")).default,
  ],
  RFCs: [
    (await import("../rfcs/core-architecture/RFC.md?raw")).default,
    (await import("../rfcs/tech-stack/RFC.md?raw")).default,
  ],
};
