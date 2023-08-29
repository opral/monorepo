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
		readdir: async (path: Parameters<NodeishFilesystemSubset["readdir"]>[0]) => {
			return (await vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(base, path))).map(
				(dir) => dir[0],
			)
		},
		readFile: async (
			path: Parameters<NodeishFilesystemSubset["readFile"]>[0],
			options?: Parameters<NodeishFilesystemSubset["readFile"]>[1],
		) => {
			const joinedPath = vscode.Uri.joinPath(base, path)
			const rawFile = await vscode.workspace.fs.readFile(joinedPath)
			if (options?.encoding === "utf-8") return new TextDecoder(options.encoding).decode(rawFile)
			return rawFile
		},
		writeFile: async (
			file: Parameters<NodeishFilesystemSubset["writeFile"]>[0],
			data: Parameters<NodeishFilesystemSubset["writeFile"]>[1],
		) => {
			return vscode.workspace.fs.writeFile(
				vscode.Uri.joinPath(base, file),
				typeof data === "string" ? new TextEncoder().encode(data) : data,
			)
		},
		mkdir: async (path: Parameters<NodeishFilesystemSubset["mkdir"]>[0]) => {
			return vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(base, path)) as unknown as
				| undefined
				| string
		},
	}
}
