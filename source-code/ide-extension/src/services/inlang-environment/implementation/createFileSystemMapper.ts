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
			return (await target.readDirectory(vscode.Uri.joinPath(base, path))).map((dir) => dir[0])
		},
		readFile: async (id) => {
			const rawFile = await target.readFile(vscode.Uri.joinPath(base, id))
			return new TextDecoder().decode(rawFile)
		},
		writeFile: async (file, data) => {
			return target.writeFile(
				vscode.Uri.joinPath(base, file),
				typeof data === "string" ? new TextEncoder().encode(data) : data,
			)
		},
		mkdir: async (path) => {
			return target.createDirectory(vscode.Uri.joinPath(base, path)) as unknown as
				| undefined
				| string
		},
	}
}
