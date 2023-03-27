/**
 * Minimal filesystem required by inlang to work
 */
export type FS = {
	readFile: (id: string) => Promise<string>
	writeFile: (file: string, data: string) => Promise<void>
	readdir: (path: string) => Promise<Array<string | object>>
}
