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

//
export type $import = (uri: string) => Promise<any>

/**
 * Initializes the $import function.
 *
 * @example
 * const $import = initialize$import({ fs: fs.promises, fetch });
 * const module = await $import('./some-module.js');
 */
export function initialize$import(args: {
	/**
	 * Directory from which the import should be resolved. Be careful, as the working directory of the fs is not changed!
	 *
	 * @deprecated, because it can lead to unintended side effects. Use only for testings. Likely to be removed in the future.
	 */
	workingDirectory?: string
	/** the fs from which the file can be read */
	fs: $fs
	/** http client implementation */
	fetch: typeof fetch
}): (uri: string) => ReturnType<typeof $import> {
	// resembles a native import api
	return (uri: string) => $import(uri, { workingDirectory: "/", ...args })
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
		/** directory from which the import should be resolved */
		workingDirectory: string
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
		: // @ts-ignore - Uses node under the hood which sometimes takes the encoding as a second argument
		  ((await environment.fs.readFile(`${environment.workingDirectory}/${uri}`, "utf-8")) as string)
	const moduleWithMimeType = "data:application/javascript;base64," + btoa(moduleAsText)
	return await import(/* @vite-ignore */ moduleWithMimeType)
}
