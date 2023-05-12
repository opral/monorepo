// eslint-disable-next-line no-restricted-imports
import * as nodefs from "node:fs/promises"
import { Volume } from "memfs"
import type { NodeishFilesystem } from "../interface.js"
import { createMemoryFs } from "../implementations/memoryFs.js"

/**
 * The filesystems to test every code on.
 *
 * Use this in your tests like this:
 *
 * @example
 * for (const [name, fs] of Object.entries(filesystems)) {
 *  describe(name, () => {
 *    it("should ...", () => {
 *     fs.writeFile(...)
 *    })
 *  })
 * }
 */
export const filesystems: Record<string, NodeishFilesystem> = {
	"node:fs/promises": nodefs,
	"@inlang-git/memoryFs": createMemoryFs(),
	// @ts-expect-error - memfs types are wrong
	memfs: new Volume().promises,
}
