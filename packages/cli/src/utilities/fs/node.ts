import type { FileSystem } from "./types.js"
import * as fs from "node:fs"

// fs wrapper
export const nodeFileSystem: FileSystem = {
	readDirectory: async (dir: string) => {
		try {
			const entries = await fs.promises.readdir(dir)
			return entries.map<[string, number]>((entry) => [entry, 0])
		} catch (error) {
			console.error(`node:fs: Error reading directory '${dir}':`, error)
			return []
		}
	},
	exists: async (path: string) => {
		try {
			await fs.promises.access(path, fs.constants.F_OK)
			return true
		} catch (error) {
			console.error(`node:fs: Error checking existence of '${path}':`, error)
			return false
		}
	},
	readFile: async (path: string, encoding: BufferEncoding | undefined) => {
		try {
			const content = await fs.promises.readFile(path, encoding)
			return content.toString()
		} catch (error) {
			console.error(`node:fs: Error reading file '${path}':`, error)
			return ""
		}
	},
	stat: async (path: string) => {
		try {
			const stat = await fs.promises.stat(path)
			return stat
		} catch (error) {
			console.error(`node:fs: Error getting file stats for '${path}':`, error)
			return undefined
		}
	},
}
