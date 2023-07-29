import { RequiredFrontmatter } from "@inlang/website/markdown"

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter

/**
 * The table of contents split by categories.
 */
export const tableOfContents: Record<string, { raw: string; import: string }[]> = {
	"Getting started": [
		{
			raw: "./getting-started/introduction.md?raw",
			import: (await import("./getting-started/introduction.md?raw")).default,
		},
		{
			raw: "./getting-started/quick-start.md?raw",
			import: (await import("./getting-started/quick-start.md?raw")).default,
		},
	],
	Apps: [
		{
			raw: "./apps/editor.md?raw",
			import: (await import("./apps/editor.md?raw")).default,
		},
		{
			raw: "./apps/ide-extension.md?raw",
			import: (await import("./apps/ide-extension.md?raw")).default,
		},
		{
			raw: "../source-code/cli/README.md?raw",
			import: (await import("../source-code/cli/README.md?raw")).default,
		},
	],
	Plugins: [
		{
			raw: "./plugins/registry.md?raw",
			import: (await import("./plugins/registry.md?raw")).default,
		},
		{
			raw: "./plugins/custom-plugins.md?raw",
			import: (await import("./plugins/custom-plugins.md?raw")).default,
		},
	],
	SDK: [
		{
			raw: "./sdk/general.md?raw",
			import: (await import("./sdk/general.md?raw")).default,
		},
		{
			raw: "./sdk/usage.md?raw",
			import: (await import("./sdk/usage.md?raw")).default,
		},
		{
			raw: "./sdk/configuration.md?raw",
			import: (await import("./sdk/configuration.md?raw")).default,
		},
		{
			raw: "./sdk/sveltekit/overview.md?raw",
			import: (await import("./sdk/sveltekit/overview.md?raw")).default,
		},
		{
			raw: "./sdk/sveltekit/advanced.md?raw",
			import: (await import("./sdk/sveltekit/advanced.md?raw")).default,
		},
	],
	Guide: [
		{
			raw: "./badge.md?raw",
			import: (await import("./badge.md?raw")).default,
		},
		// {
		// (await import("./ci-cd.md?raw")).default,
		// Include the relevant information if needed.
		// },
		{
			raw: "./build-on-inlang.md?raw",
			import: (await import("./build-on-inlang.md?raw")).default,
		},
	],
	Core: [
		{
			raw: "./ast.md?raw",
			import: (await import("./ast.md?raw")).default,
		},
		{
			raw: "../source-code/core/src/environment/README.md?raw",
			import: (await import("../source-code/core/src/environment/README.md?raw")).default,
		},
		{
			raw: "./query.md?raw",
			import: (await import("./query.md?raw")).default,
		},
		{
			raw: "../source-code/core/src/lint/README.md?raw",
			import: (await import("../source-code/core/src/lint/README.md?raw")).default,
		},
	],
	Community: [
		{
			raw: "../CONTRIBUTING.md?raw",
			import: (await import("../CONTRIBUTING.md?raw")).default,
		},
		{
			raw: "./code-organization.md?raw",
			import: (await import("./code-organization.md?raw")).default,
		},
	],
}
