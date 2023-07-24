// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"
import type { NodeishFilesystem } from "./NodeishFilesystem.js"

// Filesystem must be a subset of node:fs/promises.
fs satisfies NodeishFilesystem
