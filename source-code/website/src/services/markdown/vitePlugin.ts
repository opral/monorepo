import type { PluginOption } from "vite";
//! chokidar is not defined in package.json
//  using chokidar from vite's dependencies.
//  because it's only used here and shouldn't be
//  required in the first place. see comment below.
import chokidar from "chokidar";
import glob from "fast-glob";
import fs from "node:fs/promises";
import { parseMarkdown, RequiredFrontmatter } from "./logic.js";

/**
 * The index of the documentation site.
 *
 * Takes the `tableOfContents` and generates an object that
 * can be used to retrieve document via href.
 *
 * @example
 * 	{
 * 		"/documentation/intro": document,
 * 		"/documentation/getting-started": document,
 * 	}
 */
export let markdownIndex = await generateMarkdownIndex();

/**
 * Vite plugin to listen for changes if a file with `.md` has been changed.
 *
 * Fires an event that dependent code can listen to and therefore react.
 */
export function markdownHotModuleReload(): PluginOption {
	return {
		name: "markdown-hot-reload",
		configureServer: (server) => {
			// must use chokidar directly instead of server.watcher
			// because, for unknown reasons, the server.watcher
			// does not watch parent directories (even if defined as below)
			chokidar.watch("../../**/*.md").on("change", async () => {
				markdownIndex = await generateMarkdownIndex();
				console.log("markdown changed, reloading...");
				server.ws.send({ type: "full-reload", path: "*" });
			});
		},
	};
}

async function generateMarkdownIndex() {
	console.log("generating markdown index");
	const paths = await glob("../../**/*.md");
	const files = await Promise.all(
		paths.map(async (path) =>
			parseMarkdown({
				text: await fs.readFile(path, "utf-8"),
				FrontmatterSchema: RequiredFrontmatter,
			})
		)
	);
	return Object.fromEntries(files.map((file) => [file.frontmatter.href, file]));
}
