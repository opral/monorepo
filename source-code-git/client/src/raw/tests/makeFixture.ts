//TODO: normal imports instad of relative
import { createMemoryFs, normalizePath } from "@inlang-git/fs"
import type { NodeishFilesystem } from "@inlang-git/fs"
import { copyDirectory } from "@inlang/core/test"
import * as nodeFs from "node:fs/promises"
// @ts-expect-error - internal apis have no type declarations
import { FileSystem } from "isomorphic-git/internal-apis"

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
