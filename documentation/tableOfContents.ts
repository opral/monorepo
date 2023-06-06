import { RequiredFrontmatter } from "@inlang/website/markdown"

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter

/**
 * The table of contents split by categories.
 */
export const tableOfContents: Record<string, string[]> = {
	"Getting started": [
		(await import("./getting-started/introduction.md?raw")).default,
		(await import("./getting-started/quick-start.md?raw")).default,
	],
	Apps: [
		(await import("./apps/editor.md?raw")).default,
		(await import("./apps/ide-extension.md?raw")).default,
		(await import("../source-code/cli/README.md?raw")).default,
	],
	Plugins: [
		(await import("./plugins/registry.md?raw")).default,
		(await import("./plugins/custom-plugins.md?raw")).default,
	],
	SDK: [
		(await import("./sdk/general.md?raw")).default,
		(await import("./sdk/usage.md?raw")).default,
		(await import("./sdk/configuration.md?raw")).default,
		(await import("./sdk/sveltekit.md?raw")).default,
		// (await import("./sdk/custom.md?raw")).default,
	],
	Guide: [
		(await import("./badge.md?raw")).default,
		// (await import("./ci-cd.md?raw")).default,
		(await import("./build-on-inlang.md?raw")).default,
	],
	Core: [
		(await import("./ast.md?raw")).default,
		(await import("../source-code/core/src/environment/README.md?raw")).default,
		(await import("./query.md?raw")).default,
		(await import("../source-code/core/src/lint/README.md?raw")).default,
	],
	Community: [
		(await import("../CONTRIBUTING.md?raw")).default,
		(await import("./code-organization.md?raw")).default,
	],
}
