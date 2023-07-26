import { RequiredFrontmatter } from "@inlang/website/markdown"

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter

/**
 * Function to dynamically import a markdown file given its path.
 */
async function importMarkdown(path) {
	return (await import(/* @vite-ignore */ path)).default
}

/**
 * Helper function to generate table of contents for a given category.
 */
async function generateTableOfContents(category, files) {
	const rawPaths = files.map((file) => file + "?raw")
	const importPaths = await importMarkdownArray(rawPaths)
	return {
		raw: rawPaths,
		import: importPaths,
	}
}

/**
 * Helper function to generate table of contents for all categories.
 */
async function generateAllTableOfContents(categories) {
	const tableOfContents = {}
	for (const [category, files] of Object.entries(categories)) {
		tableOfContents[category] = await generateTableOfContents(category, files)
	}
	return tableOfContents
}

/**
 * Helper function to convert an array of raw paths to an array of imported modules.
 */
async function importMarkdownArray(rawPaths) {
	return Promise.all(rawPaths.map((path) => importMarkdown(path)))
}

/**
 * The table of contents split by categories.
 */
export const tableOfContents = await generateAllTableOfContents({
	"Getting started": ["./getting-started/introduction.md", "./getting-started/quick-start.md"],
	Apps: ["./apps/editor.md", "./apps/ide-extension.md", "../source-code/cli/README.md"],
	Plugins: ["./plugins/registry.md", "./plugins/custom-plugins.md"],
	SDK: [
		"./sdk/general.md",
		"./sdk/usage.md",
		"./sdk/configuration.md",
		"./sdk/sveltekit/overview.md",
		"./sdk/sveltekit/advanced.md",
		// "./sdk/custom.md",
	],
	Guide: ["./badge.md", /* "./ci-cd.md", */ "./build-on-inlang.md"],
	Core: [
		"./ast.md",
		"../source-code/core/src/environment/README.md",
		"./query.md",
		"../source-code/core/src/lint/README.md",
	],
	Community: ["../CONTRIBUTING.md", "./code-organization.md"],
})
