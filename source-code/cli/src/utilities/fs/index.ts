import { nodeFileSystem } from "./env/node.js"
import type { FileSystem } from "./types.js"
import { vscodeFileSystem } from "./env/vscode.js"

export const vscodeFs: FileSystem = vscodeFileSystem
export const nodeFs: FileSystem = nodeFileSystem
export type { FileSystem }
