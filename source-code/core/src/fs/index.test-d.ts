import type { FS } from "./index.js"

// eslint-disable-next-line no-restricted-imports
import * as nodefs from "node:fs/promises"
import { fs as memfs } from "memfs"

function createFs(fs: FS): FS {
	return fs
}

//@ts-ignore - TODO outcomment when fixed
createFs(nodefs)
// @ts-ignore - TODO outcomment when fixed
createFs(memfs)
