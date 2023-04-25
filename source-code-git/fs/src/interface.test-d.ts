// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"
import type { Filesystem } from "./interface.js"

// Filesystem must be a subset of node:fs/promises.
fs satisfies Filesystem
