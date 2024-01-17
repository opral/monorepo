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
		): Promise<string> => {
			const fileData = await fs.readFile(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				options
			)
			if (typeof fileData === "string") {
				return fileData
			} else {
				return new TextDecoder().decode(fileData)
			}
		},
		writeFile: async (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			data: Parameters<NodeishFilesystem["writeFile"]>[1]
		) => {
			await fs.writeFile(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path)),
				data
			)
		},
		mkdir: async (path: Parameters<NodeishFilesystem["mkdir"]>[0]) => {
			await fs.mkdir(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
			)
			return path
		},
		readdir: async (path: Parameters<NodeishFilesystem["readdir"]>[0]) => {
			return fs.readdir(
				normalizePath(path.startsWith(normalizedBase) ? path : _path.resolve(normalizedBase, path))
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
