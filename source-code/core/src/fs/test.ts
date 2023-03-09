/**
 * !Not naming this file *.test.ts to avoid vitest running this file.
 */

// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"
import { fs as memfs } from "memfs"
import type { FS } from "./index.js"

// testing whether node and memfs can be used for
// fs without problems
const x: FS = fs
const y: FS = memfs.promises
