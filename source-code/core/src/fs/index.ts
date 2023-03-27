/**
 * Minimal filesystem required by inlang
 */
export type FS = {
	readFile: (id: string, options?: { encoding: "utf-8" }) => Promise<string>
	writeFile: (file: string, data: string) => Promise<void>
	readdir: (path: string) => Promise<Array<string | object>>
	mkdir: (path: string, options?: { recursive: boolean }) => Promise<void | string | undefined>
}
