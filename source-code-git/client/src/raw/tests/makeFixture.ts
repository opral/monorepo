import { createMemoryFs, normalizePath } from "@inlang-git/fs"
import type { NodeishFilesystem } from "@inlang-git/fs"
import * as nodeFs from "node:fs/promises"
// @ts-expect-error - internal apis have no type declarations
import { FileSystem } from "isomorphic-git/internal-apis.js"

async function copyDirectory(args: {
	copyFrom: NodeishFilesystem
	copyTo: NodeishFilesystem
	path: string
}) {
	await args.copyFrom.readdir(args.path)
	// create directory
	await args.copyTo.mkdir(args.path, { recursive: true })
	const pathsInDirectory = await args.copyFrom.readdir(args.path)
	for (const subpath of pathsInDirectory) {
		// check if the path is a file
		const path = normalizePath(`${args.path}/${subpath}`)
		const stats = await args.copyFrom.lstat(path)
		if (stats.isFile()) {
			const file = await args.copyFrom.readFile(path)
			await args.copyTo.writeFile(path, file)
		}

		if (stats.isDirectory()) {
			await copyDirectory({ ...args, path })
		}

		if (stats.isSymbolicLink()) {
			let target = await args.copyFrom.readlink(path)
			// abusing memoryFs's liberal path handling to avoid implementing `dirname`
			if (!target.startsWith("/")) target = `/${path}/../${target}`
			await args.copyTo.symlink(target, path)
		}
	}
}

export async function makeFixture(fixtureName: string) {
	const fixtureDir = "src/raw/tests/fixtures"
	const dir = `${fixtureDir}/${fixtureName}`
	const gitdir = `${fixtureDir}/${fixtureName}.git`
	const fs = createMemoryFs()

	await nodeFs
		.readdir(dir)
		.then(() => {
			return copyDirectory({ copyFrom: nodeFs, copyTo: fs, path: dir })
		})
		.catch((e) => {
			if (e.code !== "ENOENT") throw e
			return fs.mkdir(dir, { recursive: true })
		})

	await nodeFs
		.readdir(gitdir)
		.then(() => {
			return copyDirectory({ copyFrom: nodeFs, copyTo: fs, path: gitdir })
		})
		.catch((e) => {
			if (e.code !== "ENOENT") throw e
			return fs.mkdir(gitdir, { recursive: true })
		})

	return { fs: new FileSystem(fs), dir, gitdir }
}
