import { normalizePath, type NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import { default as _path } from "node:path"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(base: string): NodeishFilesystem {
	// Prevent path issue on non Unix based system normalizing the <base> before using it
	const normalizedBase = normalizePath(base)
	return {
		// @ts-expect-error
		readFile: async (
			path: Parameters<NodeishFilesystem["readFile"]>[0],
			options: Parameters<NodeishFilesystem["readFile"]>[1]
		): Promise<string> => {
			const fileData = await fs.readFile(
				path.startsWith(normalizedBase)
					? _path.normalize(path)
					: _path.normalize(normalizedBase + "/" + path),
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
				path.startsWith(normalizedBase)
					? _path.normalize(path)
					: _path.normalize(normalizedBase + "/" + path),
				data
			)
		},
		mkdir: async (path: Parameters<NodeishFilesystem["mkdir"]>[0]) => {
			await fs.mkdir(
				path.startsWith(normalizedBase)
					? _path.normalize(path)
					: _path.normalize(normalizedBase + "/" + path)
			)
			return path
		},
		readdir: async (path: Parameters<NodeishFilesystem["readdir"]>[0]) => {
			return fs.readdir(
				path.startsWith(normalizedBase)
					? _path.normalize(path)
					: _path.normalize(normalizedBase + "/" + path)
			)
		},
		stat: async (path: Parameters<NodeishFilesystem["stat"]>[0]) => {
			return fs.stat(
				path.startsWith(normalizedBase)
					? _path.normalize(path)
					: _path.normalize(normalizedBase + "/" + path)
			)
		},
	}
}
