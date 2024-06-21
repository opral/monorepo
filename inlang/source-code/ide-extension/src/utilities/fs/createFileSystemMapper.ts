import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import { default as _path } from "node:path"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(base: string, fs: NodeishFilesystem): NodeishFilesystem {
	// Prevent path issue on non Unix based system normalizing the <base> before using it
	const normalizedBase = normalizePath(base)

	/**
	 * Returns a function that normalizes it's first argument (the path) and calls the original function
	 */
	const normalized = <T extends any[], R>(
		fn: (path: string, ...rest: T) => R
	): ((path: string, ...rest: T) => R) => {
		return (path: string, ...rest: T): R => {
			return fn(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				...rest
			)
		}
	}

	return {
		// @ts-expect-error
		readFile: normalized(fs.readFile),
		writeFile: normalized(fs.writeFile),
		mkdir: normalized(fs.mkdir),
		rmdir: normalized(fs.rmdir),
		unlink: normalized(fs.unlink),
		readdir: normalized(fs.readdir),
		readlink: normalized(fs.readlink),

		// this is the only one where the wrapper does not work since there are two args ;)
		symlink: async (
			path: Parameters<NodeishFilesystem["symlink"]>[0],
			target: Parameters<NodeishFilesystem["symlink"]>[1]
		) => {
			return fs.symlink(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				normalizePath(
					target.startsWith(normalizedBase) ? target : _path.resolve(normalizedBase, target)
				)
			)
		},
		stat: normalized(fs.stat),
		watch: normalized(fs.watch),
		lstat: normalized(fs.lstat),
	}
}
