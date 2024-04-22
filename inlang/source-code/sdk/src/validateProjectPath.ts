import type { NodeishFilesystem } from "@lix-js/fs"

/**
 * validate that a project path is absolute and ends with {name}.inlang.
 *
 * @throws if the path is not valid.
 */
export function assertValidProjectPath(projectPath: string) {
	if (!isAbsolutePath(projectPath)) {
		throw new Error(`Expected an absolute path but received "${projectPath}".`)
	}
	if (!isInlangProjectPath(projectPath)) {
		throw new Error(
			`Expected a path ending in "{name}.inlang" but received "${projectPath}".\n\nValid examples: \n- "/path/to/micky-mouse.inlang"\n- "/path/to/green-elephant.inlang\n`
		)
	}
}

/**
 * tests whether a path ends with {name}.inlang
 * (does not remove trailing slash)
 */
export function isInlangProjectPath(path: string) {
	return /[^\\/]+\.inlang$/.test(path)
}

/**
 * tests whether a path starts with a forward slash (/) or a windows-style
 * drive letter (C: or D:, etc.) followed by a slash
 */
export function isAbsolutePath(path: string) {
	return /^\/|^[A-Za-z]:[\\/]/.test(path)

	// OG from sdk/src/isAbsolutePath.ts - TODO: find out where this regex came from
	// const matchPosixAndWindowsAbsolutePaths =
	// 	/^(?:[A-Za-z]:\\(?:[^\\]+\\)*[^\\]+|[A-Za-z]:\/(?:[^/]+\/)*[^/]+|\/(?:[^/]+\/)*[^/]+)$/
	// return matchPosixAndWindowsAbsolutePaths.test(path)
}

/**
 * Returns true if the path exists (file or directory), false otherwise.
 *
 */
export async function pathExists(filePath: string, nodeishFs: NodeishFilesystem) {
	// from paraglide-js/src/services/file-handling/exists.ts
	// TODO: add fs.exists to @lix-js/fs
	try {
		await nodeishFs.stat(filePath)
		return true
	} catch (error) {
		//@ts-ignore
		if (error.code === "ENOENT") {
			return false
		} else {
			throw new Error(`Failed to check if path exists: ${error}`, { cause: error })
		}
	}
}
