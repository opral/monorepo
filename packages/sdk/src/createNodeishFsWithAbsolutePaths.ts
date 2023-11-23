import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { normalizePath } from "@lix-js/fs"
import { isAbsolutePath } from "./isAbsolutePath.js"

/**
 * Wraps the nodeish filesystem subset with a function that intercepts paths
 * and prepends the base path.
 *
 * The paths are resolved from the `projectPath` argument.
 */
export const createNodeishFsWithAbsolutePaths = (args: {
	projectPath: string
	nodeishFs: NodeishFilesystemSubset
}): NodeishFilesystemSubset => {
	if (!isAbsolutePath(args.projectPath)) {
		throw new Error(`Expected an absolute path but received "${args.projectPath}".`)
	}

	// get the base path of the settings file by
	// removing the file name from the path
	const basePath = normalizePath(args.projectPath).split("/").slice(0, -1).join("/")

	const makeAbsolute = (path: string) => {
		if (isAbsolutePath(path)) {
			return normalizePath(path)
		}

		return normalizePath(basePath + "/" + path)
	}

	return {
		// @ts-expect-error
		readFile: (path: string, options: { encoding: "utf-8" | "binary" }) =>
			args.nodeishFs.readFile(makeAbsolute(path), options),
		readdir: (path: string) => args.nodeishFs.readdir(makeAbsolute(path)),
		mkdir: (path: string) => args.nodeishFs.mkdir(makeAbsolute(path)),
		writeFile: (path: string, data: string) => args.nodeishFs.writeFile(makeAbsolute(path), data),
		watch: (
			path: string,
			options: { signal: AbortSignal | undefined; recursive: boolean | undefined }
		) => args.nodeishFs.watch(makeAbsolute(path), options),
	}
}
