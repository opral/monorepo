import type { NodeishFilesystemSubset } from "@inlang/sdk"
import fs from "node:fs/promises"
import { default as _path } from "node:path"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(base: string): NodeishFilesystemSubset {
	return {
		// @ts-expect-error
		readFile: async (
			path: Parameters<NodeishFilesystemSubset["readFile"]>[0],
			options: Parameters<NodeishFilesystemSubset["readFile"]>[1],
		): Promise<string> => {
			const fileData = await fs.readFile(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
				options,
			)
			if (typeof fileData === "string") {
				return fileData
			} else {
				return new TextDecoder().decode(fileData)
			}
		},
		writeFile: async (
			path: Parameters<NodeishFilesystemSubset["writeFile"]>[0],
			data: Parameters<NodeishFilesystemSubset["writeFile"]>[1],
		) => {
			await fs.writeFile(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
				data,
			)
		},
		mkdir: async (path: Parameters<NodeishFilesystemSubset["mkdir"]>[0]) => {
			await fs.mkdir(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
			)
			return path
		},
		readdir: async (path: Parameters<NodeishFilesystemSubset["readdir"]>[0]) => {
			return fs.readdir(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
			)
		},
	}
}
