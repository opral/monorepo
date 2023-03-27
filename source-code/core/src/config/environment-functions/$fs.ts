import type { fs as memfs } from "memfs"

/**
 * ! IF YOU DO CHANGES TO THIS FILE,
 * ! CONTACT @samuelstroschein BEFORE.
 */

/**
 * Minimal filesystem required by inlang.
 *
 * Uses memfs under the hood for now. To avoid
 * type issues, use memfs or node:fs/promises
 * with @ts-ignore.
 */
export type $fs = {
	readFile: (
		...args: Parameters<typeof memfs.promises.readFile>
	) => ReturnType<typeof memfs.promises.readFile>
	writeFile: (
		...args: Parameters<typeof memfs.promises.writeFile>
	) => ReturnType<typeof memfs.promises.writeFile>
	readdir: (
		...args: Parameters<typeof memfs.promises.readdir>
	) => ReturnType<typeof memfs.promises.readdir>
	mkdir: (
		...args: Parameters<typeof memfs.promises.mkdir>
	) => ReturnType<typeof memfs.promises.mkdir>
}
