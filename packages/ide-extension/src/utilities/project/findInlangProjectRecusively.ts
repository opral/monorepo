import type { NodeishFilesystem } from "@lix-js/fs"
import * as path from "node:path"

export async function findInlangProjectRecursively(args: {
	nodeishFs: NodeishFilesystem
	rootPath: string
}): Promise<string[]> {
	const targetSuffix = ".inlang"
	const foundFolders: string[] = []

	async function searchForFolders(currentPath: string) {
		try {
			const items = await args.nodeishFs.readdir(currentPath)
			for (const item of items) {
                if (item === "node_modules") continue
                
				const itemPath = path.join(currentPath, item)
				const stat = await args.nodeishFs.stat(itemPath)

				if (stat.isDirectory() && item.endsWith(targetSuffix)) {
					foundFolders.push(itemPath)
				}

				// Continue searching recursively
				if (stat.isDirectory()) {
					await searchForFolders(itemPath)
				}
			}
		} catch (error) {
			// Handle any errors here
			console.error(`Error while processing ${currentPath}: ${error}`)
		}
	}

	await searchForFolders(args.rootPath)
	return foundFolders
}
