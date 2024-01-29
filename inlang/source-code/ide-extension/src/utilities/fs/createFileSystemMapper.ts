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
	return {
		// @ts-expect-error
		readFile: async (
			path: Parameters<NodeishFilesystem["readFile"]>[0],
			options: Parameters<NodeishFilesystem["readFile"]>[1]
		): Promise<string | Uint8Array> => {
			return fs.readFile(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				options
			)
		},
		writeFile: async (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			data: Parameters<NodeishFilesystem["writeFile"]>[1]
		) => {
			return fs.writeFile(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				data
			)
		},
		mkdir: async (path: Parameters<NodeishFilesystem["mkdir"]>[0]) => {
			return fs.mkdir(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
		rmdir: async (path: Parameters<NodeishFilesystem["rmdir"]>[0]) => {
			return fs.rmdir(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
		unlink: async (path: Parameters<NodeishFilesystem["unlink"]>[0]) => {
			return fs.unlink(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
		readdir: async (path: Parameters<NodeishFilesystem["readdir"]>[0]) => {
			return fs.readdir(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
		readlink: async (path: Parameters<NodeishFilesystem["readlink"]>[0]) => {
			return fs.readlink(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
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
		stat: async (path: Parameters<NodeishFilesystem["stat"]>[0]) => {
			return fs.stat(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
		watch: (
			path: Parameters<NodeishFilesystem["watch"]>[0],
			options: Parameters<NodeishFilesystem["watch"]>[1]
		) => {
			return fs.watch(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				options
			)
		},
		lstat: async (path: Parameters<NodeishFilesystem["lstat"]>[0]) => {
			return fs.lstat(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
		},
	}
}
