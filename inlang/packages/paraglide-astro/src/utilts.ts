// vendored in from vite
import path from "node:path"

const windowsSlashRE = /\\/g
function slash(p: string): string {
	return p.replace(windowsSlashRE, "/")
}

const isWindows = typeof process !== "undefined" && process.platform === "win32"

export function nodeNormalizePath(id: string) {
	return path.posix.normalize(isWindows ? slash(id) : id)
}
