// TODO
// 1. We should get rid of `encoding` and the possibility to return a Buffer. Buffer is node dependent.
// 2. Remove the implementation dependent return types. The return type of `mkdir` and `readdir` is implementation dependent.

/**
 * Minimal filesystem required by inlang
 */
export type FS = {
	readFile: (path: string, options?: { encoding: "utf-8" }) => Promise<string | Buffer>
	writeFile: (path: string, data: string) => Promise<void>
	readdir: (path: string) => Promise<Array<string | object>>
	mkdir: (path: string, options?: { recursive: boolean }) => Promise<void | string | undefined>
}
