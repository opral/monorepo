import * as vscode from "vscode"
import type { InlangEnvironment } from "@inlang/core/environment"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param target vscode file system which should be mapped
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(
	target: vscode.FileSystem,
	base: vscode.Uri,
): InlangEnvironment["$fs"] {
	return {
		readdir: async (path) => {
			// @ts-ignore
			return (await target.readDirectory(vscode.Uri.joinPath(base, path))).map((dir) => dir[0])
		},
		readFile: async (id) => {
			// @ts-ignore
			const rawFile = await target.readFile(vscode.Uri.joinPath(base, id))
			return new TextDecoder().decode(rawFile)
		},
		writeFile: async (file, data) => {
			// @ts-ignore
			return target.writeFile(vscode.Uri.joinPath(base, file), new TextEncoder().encode(data))
		},
		mkdir: async (path) => {
			// @ts-ignore
			return target.createDirectory(vscode.Uri.joinPath(base, path))
		},
	}
}
