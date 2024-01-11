import type { NodeishFilesystem } from "@lix-js/fs"
import * as path from "node:path"

export async function findInlangProjectRecursively(args: {
	nodeishFs: NodeishFilesystem
	rootPath: string
}): Promise<string[]> {
	const targetSuffix = ".inlang"
	const foundFolders: string[] = []

	async function searchForFolders(currentPath: string): Promise<void> {
		try {
			const items = await args.nodeishFs.readdir(currentPath)
			const searchPromises = items.map(async (item) => {
				if (item === "node_modules") return

				const itemPath = path.join(currentPath, item)
				const stat = await args.nodeishFs.stat(itemPath)

				if (stat.isDirectory()) {
					if (item.endsWith(targetSuffix)) {
						foundFolders.push(itemPath)
						// No need to search subdirectories
						return
					}

					// Continue searching recursively
					await searchForFolders(itemPath)
				}
			})

			// Wait for all searches to complete
			await Promise.all(searchPromises)
		} catch (error) {
			console.error(`Error while processing ${currentPath}: ${error}`)
		}
	}

	await searchForFolders(args.rootPath)
	return foundFolders
}
