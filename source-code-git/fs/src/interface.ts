/**
 * The filesystem interface.
 *
 * The filesystem interface is a strict subset of `node:fs/promises`
 * that is cross platform compatible (browser, node).
 *
 * Node API reference https://nodejs.org/api/fs.html#fspromisesaccesspath-mode
 */
export type NodeishFilesystem = {
	writeFile: (path: string, data: string | Uint8Array, options?: { mode: number }) => Promise<void>
	readFile: (path: string, options?: { encoding: "utf-8" | "binary" }) => Promise<FileData>
	readdir: (path: string) => Promise<string[]>
	/**
	 * https://nodejs.org/api/fs.html#fspromisesmkdirpath-options
	 *
	 * Upon success, fulfills with undefined if recursive is false, or the first directory path created if recursive is true.
	 */
	mkdir: (path: string, options?: { recursive: boolean }) => Promise<string | undefined>
	rm: (path: string, options?: { recursive: boolean }) => Promise<void>
	rmdir: (path: string) => Promise<void>
	symlink: (target: string, path: string) => Promise<void>
	unlink: (path: string) => Promise<void>
	readlink: (path: string) => Promise<string>
	stat: (path: string) => Promise<NodeishStats>
	lstat: (path: string) => Promise<NodeishStats>
}

export type FileData = string | Uint8Array

export type NodeishStats = {
	ctimeMs: number
	mtimeMs: number
	dev: number
	ino: number
	mode: number
	uid: number
	gid: number
	size: number
	isFile: () => boolean
	isDirectory: () => boolean
	isSymbolicLink: () => boolean
	symlinkTarget?: string
}
