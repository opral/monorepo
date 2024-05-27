/**
 * Internal utility function to validate if a path is absolute or not.
 *
 * To avoid bugs, we should enforce that all paths are absolute.
 *
 * @throws if the path is not absolute.
 *
 * @example
 * 	assertIsAbsolutePath("/absolute/path")
 */
export function assertIsAbsolutePath(path: string) {
	// tests whether a path starts with a forward slash (/) or a Windows-style
	// drive letter (C:\ or D:\, etc.) followed by a backslash (\)
	if ((path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path)) === false) {
		{
			throw new Error(`Path is not absolute: ${path}. All paths should be absolute to avoid bugs.`)
		}
	}
}

/*
 * normalize-path <https://github.com/jonschlinkert/normalize-path>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */
export function normalizePath(path: string, stripTrailing?: boolean): string {
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
	const stack: string[] = []

	for (const seg of segs) {
		if (seg === "..") {
			stack.pop()
		} else if (seg !== ".") {
			stack.push(seg)
		}
	}

	if (stripTrailing !== false && stack.at(-1) === "") {
		stack.pop()
	}

	return prefix + stack.join("/")
}

/**
 * Removes extraneous dots and slashes, resolves relative paths and ensures the
 * path begins and ends with '/'
 * FIXME: unify with utilities/normalizePath!
 */
const dots = /(\/|^)(\.\/)+/g
const slashes = /\/+/g
const upreference = /(?<!\.\.)[^/]+\/\.\.\//
export function normalPath(path: string): string {
	// const origPath = path
	// FIXME: move to simple logic liek this:
	// const newPath =
	// 	path === "" || path === "/" || path === "." || path === "//."
	// 		? "/"
	// 		: `/${path
	// 				.split("/")
	// 				.filter((elem) => elem !== "")
	// 				.join("/")}/`
	// return newPath

	// all THIS is super slow and not needed:
	// Append '/' to the beginning and end
	path = `/${path}/`
	// Handle the edge case where a path begins with '/..'
	path = path.replace(/^\/\.\./, "")
	// Remove extraneous '.' and '/'
	path = path.replace(dots, "/").replace(slashes, "/")
	// Resolve relative paths if they exist
	let match
	while ((match = path.match(upreference)?.[0])) {
		path = path.replace(match, "")
	}
	// if (newPath !== path) {
	// 	console.log({ in: origPath, out: path, newPath })
	// }
	return path
}

export function getDirname(path: string): string {
	return normalPath(
		path
			.split("/")
			.filter((x) => x)
			.slice(0, -1)
			.join("/") ?? path
	)
}

export function getBasename(path: string): string {
	return (
		path
			.split("/")
			.filter((x) => x)
			.at(-1) ?? path
	)
}
