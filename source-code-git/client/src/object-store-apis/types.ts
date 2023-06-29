export type FileData = string | Uint8Array
export type ObjectStoreFilesystem = {
	writeFile: (path: string, data: string | Uint8Array, options?: { mode: number }) => Promise<void>
	readFile: (path: string, options?: { encoding: "utf-8" | "binary" }) => Promise<FileData>
	readdir: (path: string) => Promise<string[]>
	mkdir: (path: string) => Promise<void>
}
