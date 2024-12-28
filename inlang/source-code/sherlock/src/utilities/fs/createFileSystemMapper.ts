import { default as _path } from "node:path"
import type * as fs from "node:fs/promises"

// Define an interface for the fs methods
export type FileSystem = typeof fs

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(base: string, fs: FileSystem): FileSystem {
	// Prevent path issue on non Unix based system normalizing the <base> before using it
	const normalizedBase = _path.normalize(base)

	return {
		// TODO: Those expected typescript errors are because of overloads in node:fs/promises
		// @ts-expect-error
		readFile: async (
			path: Parameters<FileSystem["readFile"]>[0],
			options: Parameters<FileSystem["readFile"]>[1]
		): Promise<string | Uint8Array> => {
			return fs.readFile(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		writeFile: async (
			path: Parameters<FileSystem["writeFile"]>[0],
			data: Parameters<FileSystem["writeFile"]>[1],
			options: Parameters<FileSystem["writeFile"]>[2]
		) => {
			return fs.writeFile(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				data,
				options
			)
		},
		// @ts-expect-error
		mkdir: async (
			path: Parameters<FileSystem["mkdir"]>[0],
			options?: Parameters<FileSystem["mkdir"]>[1]
		) => {
			return fs.mkdir(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		rmdir: async (path: Parameters<FileSystem["rmdir"]>[0]) => {
			return fs.rmdir(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		rm: async (path: Parameters<FileSystem["rm"]>[0], options: Parameters<FileSystem["rm"]>[1]) => {
			return fs.rm(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		unlink: async (path: Parameters<FileSystem["unlink"]>[0]) => {
			return fs.unlink(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		readdir: async (path: Parameters<FileSystem["readdir"]>[0]) => {
			return fs.readdir(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		readlink: async (path: Parameters<FileSystem["readlink"]>[0]) => {
			return fs.readlink(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		symlink: async (
			path: Parameters<FileSystem["symlink"]>[0],
			target: Parameters<FileSystem["symlink"]>[1]
		) => {
			return fs.symlink(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				_path.normalize(
					String(target).startsWith(normalizedBase)
						? String(target)
						: _path.resolve(normalizedBase, String(target))
				)
			)
		},
		// @ts-expect-error
		stat: async (path: Parameters<FileSystem["stat"]>[0]) => {
			return fs.stat(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		lstat: async (path: Parameters<FileSystem["lstat"]>[0]) => {
			return fs.lstat(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		watch: (
			path: Parameters<FileSystem["watch"]>[0],
			options: Parameters<FileSystem["watch"]>[1]
		) => {
			return fs.watch(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		access: async (
			path: Parameters<FileSystem["access"]>[0],
			mode: Parameters<FileSystem["access"]>[1]
		) => {
			return fs.access(
				_path.normalize(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				mode
			)
		},
		copyFile: async (
			src: Parameters<FileSystem["copyFile"]>[0],
			dest: Parameters<FileSystem["copyFile"]>[1],
			flags: Parameters<FileSystem["copyFile"]>[2]
		) => {
			return fs.copyFile(
				_path.normalize(
					String(src).startsWith(normalizedBase)
						? String(src)
						: _path.resolve(normalizedBase, String(src))
				),
				_path.normalize(
					String(dest).startsWith(normalizedBase)
						? String(dest)
						: _path.resolve(normalizedBase, String(dest))
				),
				flags
			)
		},
	}
}
