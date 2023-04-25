import type { Filesystem, FileData } from "./schema.js"
export type MemoryInode = FileData | MemoryDirectory
export type MemoryDirectory = Map<string, MemoryInode>

export interface MemoryFilesystem extends Filesystem {
	_root: Map<string, MemoryInode>
	_specialPaths: string[]
}
