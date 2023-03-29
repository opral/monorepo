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
	/** the fs from which the file can be read */
	fs: $fs
	/** http client implementation */
	fetch: typeof fetch
}): (uri: string) => ReturnType<typeof $import> {
	// resembles a native import api
	return (uri: string) => $import(uri, args)
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
		: // @ts-ignore - Uses node under the hood which sometimes takes the encoding as a second argument
		  ((await environment.fs.readFile(normalizePath(uri), "utf-8")) as string)
	const moduleWithMimeType = "data:application/javascript;base64," + btoa(moduleAsText)
	return await import(/* @vite-ignore */ moduleWithMimeType)
}

/*
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
function normalizePath(path: string) {
	if (typeof path !== "string") {
		throw new TypeError("expected path to be a string")
	}

	if (path === "\\" || path === "/") return "/"

	const len = path.length
	if (len <= 1) return path

	// ensure that win32 namespaces has two leading slashes, so that the path is
	// handled properly by the win32 version of path.parse() after being normalized
	// https://msdn.microsoft.com/library/windows/desktop/aa365247(v=vs.85).aspx#namespaces
	let prefix = ""
	if (len > 4 && path[3] === "\\") {
		const ch = path[2]
		if ((ch === "?" || ch === ".") && path.slice(0, 2) === "\\\\") {
			path = path.slice(2)
			prefix = "//"
		}
	}
	const segs = path.split(/[/\\]+/)
	return prefix + segs.join("/")
}
