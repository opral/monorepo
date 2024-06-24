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

export function normalizePath(path: string, { trailingSlash, leadingSlash }: { trailingSlash?: 'always' | 'strip', leadingSlash?: 'always' } = {}): string {
	path = path.replace(/^\.\//, '/')

	if (path === "\\" || path === "" || path === "/" || path === "."  || path === "//.") {
		return "/"
	}

	if (path.length <= 1) {
		return path
	}
	
	const hadTrailingSlash = path[path.length - 1] === '/' || path[path.length - 1] === '\\'
	const addleadingSlash = leadingSlash === 'always' || path[0] === '/' || path[0] === '\\'

	const segs = path.split(/[/\\]+/)
	const stack: string[] = []
	for (const seg of segs) {
		if (seg === "..") {
			stack.pop()
		} else if (seg && seg !== ".") {
			stack.push(seg)
		}
	}

	if ((trailingSlash !== 'strip') && (hadTrailingSlash || trailingSlash === 'always')) {
		stack.push("")
	}

	return addleadingSlash ?  ('/' + stack.join("/")) : stack.join("/")
}

export function getDirname(path: string): string {
	const dirname = path
	.split("/")
	.filter((x) => x)
	.slice(0, -1)
	.join("/")

	return normalizePath(dirname, { leadingSlash: 'always', trailingSlash: 'always'}) ?? path
}

export function getBasename(path: string): string {	
	return (
		path
			.split("/")
			.filter((x) => x)
			.at(-1) ?? ''
	)
}
