import { normalizePath } from "@lix-js/fs"
import { default as _path } from "node:path"

/**
 * Creates a new mapper between vscode and inlang file systems.
 *
 * @param base uri for relative paths
 * @returns file system mapper
 */
export function createFileSystemMapper(
	base: string,
	fs: typeof import("node:fs/promises")
): typeof import("node:fs/promises") {
	// Prevent path issue on non Unix based system normalizing the <base> before using it
	const normalizedBase = normalizePath(base)

	return {
		// TODO: Those expected typescript errors are because of overloads in node:fs/promises
		// @ts-expect-error
		readFile: async (
			path: Parameters<(typeof import("node:fs/promises"))["readFile"]>[0],
			options: Parameters<(typeof import("node:fs/promises"))["readFile"]>[1]
		): Promise<string | Uint8Array> => {
			return fs.readFile(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		writeFile: async (
			path: Parameters<(typeof import("node:fs/promises"))["writeFile"]>[0],
			data: Parameters<(typeof import("node:fs/promises"))["writeFile"]>[1],
			options: Parameters<(typeof import("node:fs/promises"))["writeFile"]>[2]
		) => {
			return fs.writeFile(
				normalizePath(
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
			path: Parameters<(typeof import("node:fs/promises"))["mkdir"]>[0],
			options?: Parameters<(typeof import("node:fs/promises"))["mkdir"]>[1]
		) => {
			return fs.mkdir(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		rmdir: async (path: Parameters<(typeof import("node:fs/promises"))["rmdir"]>[0]) => {
			return fs.rmdir(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		rm: async (
			path: Parameters<(typeof import("node:fs/promises"))["rm"]>[0],
			options: Parameters<(typeof import("node:fs/promises"))["rm"]>[1]
		) => {
			return fs.rm(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		unlink: async (path: Parameters<(typeof import("node:fs/promises"))["unlink"]>[0]) => {
			return fs.unlink(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		readdir: async (path: Parameters<(typeof import("node:fs/promises"))["readdir"]>[0]) => {
			return fs.readdir(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		readlink: async (path: Parameters<(typeof import("node:fs/promises"))["readlink"]>[0]) => {
			return fs.readlink(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		symlink: async (
			path: Parameters<(typeof import("node:fs/promises"))["symlink"]>[0],
			target: Parameters<(typeof import("node:fs/promises"))["symlink"]>[1]
		) => {
			return fs.symlink(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				normalizePath(
					String(target).startsWith(normalizedBase)
						? String(target)
						: _path.resolve(normalizedBase, String(target))
				)
			)
		},
		// @ts-expect-error
		stat: async (path: Parameters<(typeof import("node:fs/promises"))["stat"]>[0]) => {
			return fs.stat(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		lstat: async (path: Parameters<(typeof import("node:fs/promises"))["lstat"]>[0]) => {
			return fs.lstat(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				)
			)
		},
		// @ts-expect-error
		watch: (
			path: Parameters<(typeof import("node:fs/promises"))["watch"]>[0],
			options: Parameters<(typeof import("node:fs/promises"))["watch"]>[1]
		) => {
			return fs.watch(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				options
			)
		},
		access: async (
			path: Parameters<(typeof import("node:fs/promises"))["access"]>[0],
			mode: Parameters<(typeof import("node:fs/promises"))["access"]>[1]
		) => {
			return fs.access(
				normalizePath(
					String(path).startsWith(normalizedBase)
						? String(path)
						: _path.resolve(normalizedBase, String(path))
				),
				mode
			)
		},
		copyFile: async (
			src: Parameters<(typeof import("node:fs/promises"))["copyFile"]>[0],
			dest: Parameters<(typeof import("node:fs/promises"))["copyFile"]>[1],
			flags: Parameters<(typeof import("node:fs/promises"))["copyFile"]>[2]
		) => {
			return fs.copyFile(
				normalizePath(
					String(src).startsWith(normalizedBase)
						? String(src)
						: _path.resolve(normalizedBase, String(src))
				),
				normalizePath(
					String(dest).startsWith(normalizedBase)
						? String(dest)
						: _path.resolve(normalizedBase, String(dest))
				),
				flags
			)
		},
	}
}
