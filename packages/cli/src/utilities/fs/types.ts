import type * as fs from "node:fs"
import type { FileStat } from "vscode"

// File system wrapper object
export interface FileSystem {
	readDirectory(dir: string): Promise<[string, number][]>
	exists(path: string): Promise<boolean>
	readFile(path: string, encoding: BufferEncoding | undefined): Promise<string>
	stat(path: string): Promise<fs.Stats | FileStat | undefined>
}
