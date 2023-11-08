import type { NodeishFilesystem } from "@lix-js/fs"
import fs from "node:fs/promises"
import { default as _path } from "node:path"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(base: string): NodeishFilesystem {
	return {
		// @ts-expect-error
		readFile: async (
			path: Parameters<NodeishFilesystem["readFile"]>[0],
			options: Parameters<NodeishFilesystem["readFile"]>[1]
		): Promise<string> => {
			const fileData = await fs.readFile(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
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
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
				data
			)
		},
		mkdir: async (path: Parameters<NodeishFilesystem["mkdir"]>[0]) => {
			await fs.mkdir(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path)
			)
			return path
		},
		readdir: async (path: Parameters<NodeishFilesystem["readdir"]>[0]) => {
			return fs.readdir(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path)
			)
		},
		stat: async (path: Parameters<NodeishFilesystem["stat"]>[0]) => {
			return fs.stat(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path)
			)
		},
		watch: (
			path: Parameters<NodeishFilesystem["watch"]>[0],
			options: Parameters<NodeishFilesystem["watch"]>[1]
		) => {
			return fs.watch(
				path.startsWith(base) ? _path.normalize(path) : _path.normalize(base + "/" + path),
				options
			)
		},
	}
}
