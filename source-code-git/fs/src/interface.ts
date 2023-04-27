/**
 * The filesystem interface.
 *
 * The filesystem interface is a strict subset of `node:fs/promises`
 * that is cross platform compatible (browser, node).
 */
export type Filesystem = {
	writeFile: (path: string, content: string) => Promise<void>
	readFile: (path: string, options: { encoding: "utf-8" }) => Promise<FileData>
	readdir: (path: string) => Promise<string[]>
	mkdir: (path: string) => Promise<void>
	rm: (path: string) => Promise<void>
}

export type FileData = string
