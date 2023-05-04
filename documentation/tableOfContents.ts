import { RequiredFrontmatter } from "@inlang/website/markdown"

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter

/**
 * The table of contents split by categories.
 */
export const tableOfContents: Record<string, string[]> = {
	Overview: [
		(await import("./introduction.md?raw")).default,
		(await import("./getting-started.md?raw")).default,
		(await import("./why-inlang.md?raw")).default,
	],
	SDK: [
		(await import("./sdk/general.md?raw")).default,
		(await import("./sdk/usage.md?raw")).default,
		(await import("./sdk/configuration.md?raw")).default,
		(await import("./sdk/sveltekit.md?raw")).default,
		(await import("./sdk/custom.md?raw")).default,
	],
	Guide: [
		(await import("./badge.md?raw")).default,
		(await import("./plugins.md?raw")).default,
		(await import("./ci-cd.md?raw")).default,
		(await import("./build-on-inlang.md?raw")).default,
	],
	Reference: [
		(await import("./ast.md?raw")).default,
		(await import("./cli.md?raw")).default,
		(await import("../source-code/core/src/environment/README.md?raw")).default,
		(await import("./query.md?raw")).default,
		(await import("../source-code/core/src/lint/README.md?raw")).default,
	],
	Contribute: [
		(await import("../CONTRIBUTING.md?raw")).default,
		(await import("./code-organization.md?raw")).default,
	],
}
