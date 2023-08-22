import * as vscode from "vscode"
import type { NodeishFilesystemSubset } from "@inlang/app"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(base: vscode.Uri): NodeishFilesystemSubset {
	return {
		readdir: async (path) => {
			return (await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(base, path))).map(
				(dir) => dir[0],
			)
		},
		readFile: async (path) => {
			const joinedPath = vscode.Uri.joinPath(base, path)
			const rawFile = await vscode.workspace.fs.readFile(joinedPath)
			return new TextDecoder().decode(rawFile) as any
		},
		writeFile: async (file, data) => {
			return vscode.workspace.fs.writeFile(
				vscode.Uri.joinPath(base, file),
				typeof data === "string" ? new TextEncoder().encode(data) : data,
			)
		},
		mkdir: async (path) => {
			return vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(base, path)) as unknown as
				| undefined
				| string
		},
	}
}
