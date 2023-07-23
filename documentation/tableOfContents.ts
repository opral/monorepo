// Separate file: ../../../../../documentation/tableOfContents.js

import { RequiredFrontmatter } from "@inlang/website/markdown"

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter

const fileSources = {
	"Getting started": [
		"./getting-started/introduction.md?raw",
		"./getting-started/quick-start.md?raw",
	],
	Apps: ["./apps/editor.md?raw", "./apps/ide-extension.md?raw", "../source-code/cli/README.md?raw"],
	Plugins: ["./plugins/registry.md?raw", "./plugins/custom-plugins.md?raw"],
	SDK: [
		"./sdk/general.md?raw",
		"./sdk/usage.md?raw",
		"./sdk/configuration.md?raw",
		"./sdk/sveltekit/overview.md?raw",
		"./sdk/sveltekit/advanced.md?raw",
		// "./sdk/custom.md?raw"
	],
	Guide: [
		"./badge.md?raw",
		// "./ci-cd.md?raw"
		"./build-on-inlang.md?raw",
	],
	Core: [
		"./ast.md?raw",
		"../source-code/core/src/environment/README.md?raw",
		"./query.md?raw",
		"../source-code/core/src/lint/README.md?raw",
	],
	Community: ["../CONTRIBUTING.md?raw", "./code-organization.md?raw"],
}

interface TableOfContentsItem {
	category: string
	content: string
}

/**
 * The table of contents as an array of objects.
 */
export async function buildTableOfContents(): Promise<TableOfContentsItem[]> {
	const tableOfContents: TableOfContentsItem[] = []

	for (const category in fileSources) {
		const contents = await Promise.all(
			fileSources[category].map(async (file: any) => {
				const module = await import(
					/* @vite-ignore */
					file
				)
				return module.default
			}),
		)

		for (const content of contents) {
			tableOfContents.push({ category, content })
		}
	}

	return tableOfContents
}

export const tableOfContentsPromise = buildTableOfContents()
