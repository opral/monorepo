import type { NodeishFilesystem, NodeishStats } from "../interface.js"
import { FilesystemError } from "../errors/FilesystemError.js"

type Inode = string | string[]

export function createMemoryFs(): NodeishFilesystem {
	// local state
	const fsMap: Map<string, Inode> = new Map()
	const fsStats: Map<string, NodeishStats> = new Map()
	const specialPaths = ["/", "", ".", ".."]

	// initialize the root to an empty dir
	fsMap.set("/", [])
	newStatEntry("/", fsStats, 1)

	// declare this locally so we don't have to write it twice for 'stat' and 'lstat'
	const stat = async function (path: Parameters<NodeishFilesystem["lstat"]>[0]) {
		path = normalPath(path)
		const stats: NodeishStats | undefined = fsStats.get(path)
		if (stats === undefined)
			throw new FilesystemError("ENOENT", path, "stat")
		return stats
	}

	return {
		writeFile: async function (
			path: Parameters<NodeishFilesystem["writeFile"]>[0],
			data: Parameters<NodeishFilesystem["writeFile"]>[1],
		) {
			path = normalPath(path)
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))


			if (parentDir?.constructor !== Array) 
				throw new FilesystemError("ENOENT", path, "writeFile")
			

			parentDir.push(getBasename(path))
			newStatEntry(path, fsStats, 0)
			fsMap.set(path, data)

		},

		readFile: async function (
			path: Parameters<NodeishFilesystem["readFile"]>[0],
			options: Parameters<NodeishFilesystem["readFile"]>[1],
		) {
			path = normalPath(path)
			const file: Inode | undefined = fsMap.get(path)
			if (typeof file === "string") return file

			if (file === undefined) throw new FilesystemError("ENOENT", path, "readFile")
			throw new FilesystemError("EISDIR", path, "readFile")
		},

		readdir: async function (path: Parameters<NodeishFilesystem["readdir"]>[0]) {
			path = normalPath(path)
			const dir: Inode | undefined = fsMap.get(path)
			if (dir?.constructor === Array) return dir
			if (dir === undefined) throw new FilesystemError("ENOENT", path, "readdir")
			throw new FilesystemError("ENOTDIR", path, "readdir")
		},

		mkdir: async function mkdir (
			path: Parameters<NodeishFilesystem["mkdir"]>[0],
			options: Parameters<NodeishFilesystem["mkdir"]>[1],
		) : Promise<string | undefined> {
			path = normalPath(path)
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			let firstPath: string

			if (typeof parentDir === "string")
				throw new FilesystemError("ENOTDIR", path, "mkdir")

			if (parentDir && parentDir.constructor === Array) {
				parentDir.push(getBasename(path))
				newStatEntry(path, fsStats, 1)
				fsMap.set(path, [])
				return path
			}

			if (options?.recursive) {
				const firstPath = await mkdir(getDirname(path), options)
				await mkdir(path, options)
				return firstPath
			}

			throw new FilesystemError("ENOENT", path, "mkdir")

		},

		rm: async function rm (
			path: Parameters<NodeishFilesystem["rm"]>[0],
			options: Parameters<NodeishFilesystem["rm"]>[1],
		) {
			path = normalPath(path)
			const target: Inode | undefined = fsMap.get(path)
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			if (parentDir === undefined || target === undefined) 
				throw new FilesystemError("ENOENT", path, "rm")

			if (typeof parentDir === "string") throw new FilesystemError("ENOTDIR", path, "rm")

			if (typeof target === "string") {
				parentDir.splice(parentDir.indexOf(getBasename(path)), 1)
				fsStats.delete(path)
				fsMap.delete(path)
				return
			}

			if (target.constructor === Array && options?.recursive) {
				await Promise.all(target.map(async (child) => {
					await rm(`${path}/${child}`, { recursive: true })
				}))
				parentDir.splice(parentDir.indexOf(getBasename(path)), 1)
				fsStats.delete(path)
				fsMap.delete(path)
				return
			}

			throw new FilesystemError("EISDIR", path, "rm")
		},

		rmdir: async function (path: Parameters<NodeishFilesystem["rmdir"]>[0]) {
			path = normalPath(path)
			const target: Inode | undefined = fsMap.get(path)
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			if (parentDir === undefined || target === undefined) 
				throw new FilesystemError("ENOENT", path, "rmdir")

			if (typeof parentDir === "string" || typeof target === "string") 
				throw new FilesystemError("ENOTDIR", path, "rmdir")

			if (target.length)
				throw new FilesystemError("ENOTEMPTY", path, "rmdir")

			parentDir.splice(parentDir.indexOf(getBasename(path)), 1)
			fsStats.delete(path)
			fsMap.delete(path)
		},

		symlink: async function (
			target: Parameters<NodeishFilesystem["symlink"]>[0],
			path: Parameters<NodeishFilesystem["symlink"]>[1],
		) {
			path = normalPath(path)
			const targetInode: Inode | undefined = fsMap.get(normalPath(target))
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			if (fsMap.get(path))
				throw new FilesystemError("EEXIST", path, "symlink", target)

			if (typeof parentDir === "string") 
				throw new FilesystemError("ENOTDIR", path, "symlink")

			if (targetInode === undefined || parentDir === undefined) 
				throw new FilesystemError("ENOENT", path, "symlink")

			parentDir.push(getBasename(path))
			newStatEntry(path, fsStats, 2, target)
			fsMap.set(path, targetInode)
		},

		unlink: async function (
			path: Parameters<NodeishFilesystem["unlink"]>[0],
		) {
			path = normalPath(path)
			const targetStats = fsStats.get(path)
			const target: Inode | undefined = fsMap.get(path)
			const parentDir: Inode | undefined = fsMap.get(getDirname(path))

			if (parentDir === undefined || target === undefined) 
				throw new FilesystemError("ENOENT", path, "unlink")

			if (typeof parentDir === "string") throw new FilesystemError("ENOTDIR", path, "unlink")

			if (targetStats?.isDirectory())
				throw new FilesystemError("EISDIR", path, "unlink")

			parentDir.splice(parentDir.indexOf(getBasename(path)), 1)
			fsStats.delete(path)
			fsMap.delete(path)
		},
		readlink: async function (
			path: Parameters<NodeishFilesystem["readlink"]>[0],
		) {
			path = normalPath(path)
			const linkStats = await stat(path)

			if (linkStats === undefined)
				throw new FilesystemError("ENOENT", path, "readlink")

			if (linkStats.symlinkTarget === undefined)
				throw new FilesystemError("EINVAL", path, "readlink")

			return linkStats.symlinkTarget
		},
		lstat: stat,
		stat:  stat,
	}
}

/**
 * Creates a new stat entry. 'kind' refers to whether the entry is for a file,
 * directory or symlink:
 * 0 = File
 * 1 = Directory
 * 2 = Symlink
 */
function newStatEntry(path: string, stats: Map<string, NodeishStats>, kind: number, target?: string) {
	const cdateMs: number = Date.now()
	stats.set(normalPath(path), {
	  ctimeMs: cdateMs,
	  mtimeMs: cdateMs,
      dev: 0,
      ino: stats.size + 1,
      mode: 0o100644,
      uid: 0,
      gid: 0,
      size: 0,
	  isFile: () => kind === 0,
	  isDirectory: () => kind === 1,
	  isSymbolicLink: () => kind === 2,
	  // symlinkTarget is only for symlinks, and is not normalized
	  symlinkTarget: target,
	})
}

function getDirname(path: string): string {
	return normalPath(
		path
		.split("/")
		.filter(x => x)
		.slice(0, -1)
		.join("/") ?? path
	)

}

function getBasename(path: string): string {
		return path
		.split("/")
		.filter(x => x)
		.at(-1) ?? path
}


/** 
 * Removes extraneous dots and slashes, resolves relative paths and ensures the
 * path begins and ends with '/' 
 */
function normalPath(path: string): string {
	const dots = /(\/|^)(\.\/)+/g
	const slashes = /\/+/g
	const upreference = /(?<!\.\.)[^\/]+\/\.\.\//
	
	// Append '/' to the beginning and end
	path = `/${path}/`

	// Handle the edge case where a path begins with '/..'
	path = path.replace(/^\/\.\./, '')
	
	// Remove extraneous '.' and '/'
	path = path.replace(dots, '/').replace(slashes, '/')

	// Resolve relative paths if they exist
	let match
	while(match = path.match(upreference)?.[0]) {
		path = path.replace(match, '')
	}

	return path
}

