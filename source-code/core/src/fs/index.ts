// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises"

/**
 * Minimal filesystem required by inlang to work
 */
export type FS = {
	readFile: (id: string) => Promise<string> | ReturnType<fs.FileHandle["readFile"]>
	writeFile: (file: string, data: string) => Promise<void>
	readdir: (path: string) => Promise<Array<string | object>>
}
