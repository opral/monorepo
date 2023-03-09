import { EnvironmentFunctions, initialize$import } from "../config/index.js"
import type { FS } from "../fs/index.js"
import { fs as memfs } from "memfs"

/**
 * Initializes a mock environment.
 *
 * The mock environment uses a virtual file system (memfs). If
 * testing inlang depends on files in the local file system,
 * you can copy the directory into the environment by providing
 * the `copyDirectory` argument.
 *
 * @param copyDirectory - if defined, copies the directory into the environment
 */
export async function mockEnvironment(args: {
	copyDirectory?: {
		fs: FS
		path: string
	}
}): Promise<EnvironmentFunctions> {
	const $fs = memfs.promises as FS
	const $import = initialize$import({
		fs: $fs,
		fetch,
	})
	const env = {
		$fs,
		$import,
	}
	if (args.copyDirectory) {
		const { fs, path } = args.copyDirectory
		await copyDirectory({ copyFrom: fs, copyTo: $fs, path })
	}
	return env
}

/**
 * Copies a directory from one fs to another.
 *
 * Useful for mocking the environment.
 */
async function copyDirectory(args: { copyFrom: FS; copyTo: FS; path: string }) {
	// create directory
	await args.copyTo.mkdir(args.path, { recursive: true })
	for (const file of await args.copyFrom.readdir("./" + args.path)) {
		const isFile = (file as string).includes(".")
		if (isFile) {
			await args.copyTo.writeFile(
				`${args.path}/${file}`,
				(await args.copyFrom.readFile(`./${args.path}/${file}`, { encoding: "utf-8" })) as string,
			)
		} else {
			await copyDirectory({ ...args, path: `${args.path}/${file}` })
		}
	}
}
