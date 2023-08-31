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
