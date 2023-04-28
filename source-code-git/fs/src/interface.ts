/**
 * The filesystem interface.
 *
 * The filesystem interface is a strict subset of `node:fs/promises`
 * that is cross platform compatible (browser, node).
 *
 * Node API reference https://nodejs.org/api/fs.html#fspromisesaccesspath-mode
 */
export type NodeishFilesystem = {
	writeFile: (path: string, data: string) => Promise<void>
	readFile: (path: string, options: { encoding: "utf-8" }) => Promise<FileData>
	readdir: (path: string) => Promise<string[]>
	/**
	 * https://nodejs.org/api/fs.html#fspromisesmkdirpath-options
	 *
	 * Upon success, fulfills with undefined if recursive is false, or the first directory path created if recursive is true.
	 */
	mkdir: (path: string, options?: { recursive: boolean }) => Promise<string | undefined>
	rm: (path: string, options?: { recursive: boolean }) => Promise<void>
}

export type FileData = string
export type TextEncoding = "utf8" | "utf-8" | "base64" | "raw"
