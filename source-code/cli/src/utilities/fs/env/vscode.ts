import type { FileSystem } from "../types.js"
import { workspace, Uri, FileType, FileStat } from "vscode"

// vscode.workspace.fs wrapper
export const vscodeFileSystem: FileSystem = {
	readDirectory: async (dir: string) => {
		try {
			const uri = Uri.file(dir)
			const entries = await workspace.fs.readDirectory(uri)
			return entries
		} catch (error) {
			console.error(`vscode: Error reading directory '${dir}':`, error)
			return []
		}
	},
	exists: async (path: string) => {
		try {
			const uri = Uri.file(path)
			await workspace.fs.stat(uri)
			return true
		} catch (error) {
			// We don't want to pollute the console with errors
			// console.error(`vscode: Error checking existence of '${path}':`, error)
			return false
		}
	},
	readFile: async (path: string) => {
		try {
			const uri = Uri.file(path)
			const content = await workspace.fs.readFile(uri)
			return content.toString()
		} catch (error) {
			console.error(`vscode: Error reading file '${path}':`, error)
			return ""
		}
	},
	stat: async (path: string) => {
		try {
			const uri = Uri.file(path)
			const stat = await workspace.fs.stat(uri)
			return stat
		} catch (error) {
			console.error(`vscode: Error getting file stats for '${path}':`, error)
			return undefined
		}
	},
	isDirectory: async (stat: FileStat) => {
		return stat.type === FileType.Directory
	},
}
