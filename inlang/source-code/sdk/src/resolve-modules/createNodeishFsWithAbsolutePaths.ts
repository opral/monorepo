import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { normalizePath } from "@lix-js/fs"

export const createNodeishFsWithAbsolutePaths = (args: {
	basePath: string
	nodeishFs: NodeishFilesystemSubset
}): NodeishFilesystemSubset => {
	const isAbsolutePath = (path: string) => /^[/\\]/.test(path)

	if (!isAbsolutePath(args.basePath)) {
		throw new Error("The argument `settingsFilePath` of `loadProject()` must be an absolute path.")
	}

	const intercept = (path: string) => {
		if (isAbsolutePath(path)) {
			return path
		}

		return normalizePath(args.basePath + "/" + path)
	}

	return {
		// @ts-expect-error
		readFile: (path: string, options: { encoding: "utf-8" | "binary" }) =>
			args.nodeishFs.readFile(intercept(path), options),
		readdir: (path: string) => args.nodeishFs.readdir(intercept(path)),
		mkdir: (path: string) => args.nodeishFs.mkdir(intercept(path)),
		writeFile: (path: string, data: string) => args.nodeishFs.writeFile(intercept(path), data),
	}
}
