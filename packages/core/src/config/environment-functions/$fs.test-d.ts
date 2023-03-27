import type { $fs } from "./$fs.js"

// eslint-disable-next-line no-restricted-imports
import * as nodefs from "node:fs/promises"
import { fs as memfs } from "memfs"

function createFs(fs: $fs): $fs {
	return fs
}

//@ts-ignore - TODO outcomment when fixed
createFs(nodefs)

createFs(memfs.promises)
