/**
 * Importing ES modules either from a local path, or from a url.
 *
 * The imported module must be ESM. A good indicator is whether
 * the "type" property in a package.json is set to "module" if
 * node is used.
 *
 * Read more on https://inlang.com/documentation/config
 */
//
// - explitcly export the interface of $import to be consumed
//   in the config with JSdoc.
//
// - not using ReturnType or FunctionArguments to increase DX
//   when hovering over the type.

import type { $fs } from "./$fs.js"
import { dedent } from "ts-dedent"
import { normalizePath } from "@inlang-git/fs"

export type $import = (uri: string) => Promise<any>

/**
 * Initializes the $import function.
 *
 * @example
 * const $import = initialize$import({ fs: fs, fetch });
 * const module = await $import('./some-module.js');
 */
export function initialize$import(args: {
	/** the fs from which the file can be read */
	fs: $fs
	/** http client implementation */
	fetch: typeof fetch
}): (uri: string) => ReturnType<typeof $import> {
	// resembles a native import api
	return (uri: string) => $import(uri, args)
}

/**
 * Error thrown when the $import function fails.
 *
 * Dedicated class to make it easier to identify this error.
 */
class $ImportError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "$ImportError"
	}
}

/**
 * Importing ES modules either from a local path, or from a url.
 *
 * The imported module must be ESM. A good indicator is whether
 * the "type" property in a package.json is set to "module" if
 * node is used.
 *
 * Read more on https://inlang.com/documentation/config
 */
async function $import(
	uri: string,
	environment: {
		/** the fs from which the file can be read */
		fs: $fs
		/** http client implementation */
		fetch: typeof fetch
	},
): Promise<any> {
	// avoiding browser built-in shadowing of fetch as global variable
	const _fetch = environment.fetch
	// polyfill for environments that don't support dynamic
	// http imports yet like VSCode.
	const moduleAsText = uri.startsWith("http")
		? await (await _fetch(uri)).text()
		: ((await environment.fs.readFile(normalizePath(uri), { encoding: "utf-8" })) as string)
	const moduleWithMimeType = "data:application/javascript," + encodeURIComponent(moduleAsText)
	try {
		return await import(/* @vite-ignore */ moduleWithMimeType)
	} catch (error) {
		let message = `Error while importing ${uri}: ${(error as Error)?.message ?? "Unknown error"}`
		if (error instanceof SyntaxError && uri.includes("jsdelivr")) {
			message += dedent`\n\n
Are you sure that the file exists on JSDelivr?

The error indicates that the imported file does not exist on JSDelivr. For non-existent files, JSDelivr returns a 404 text that JS cannot parse as a module and throws a SyntaxError.
			`
		}
		throw new $ImportError(message)
	}
}
