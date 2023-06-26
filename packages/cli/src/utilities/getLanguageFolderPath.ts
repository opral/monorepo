import path from "node:path"
import { log } from "../utilities.js"
import type { FileSystem } from "./fs/types.js"
import { potentialFolders } from "./potentialFolders.js"

export const getLanguageFolderPath = async (args: {
	rootDir: string
	fs: FileSystem
}): Promise<string | undefined> => {
	log.info("Searching for language folder in", args.rootDir)
	try {
		const searchForLanguageFolder = async (
			dir: string,
			ignoredPaths: string[],
		): Promise<string | undefined> => {
			const files = await args.fs.readDirectory(dir)

			const gitignorePath = path.join(dir, ".gitignore")
			let subIgnoredPaths: string[] = []
			if (await args.fs.exists(gitignorePath)) {
				const gitignoreContent = await args.fs.readFile(gitignorePath, "utf-8")
				subIgnoredPaths = gitignoreContent
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => !line.startsWith("#") && line !== "")
			}

			for (const [file] of files) {
				const filePath = path.join(dir, file)
				const stat = await args.fs.stat(filePath)

				if (
					stat &&
					(await args.fs.isDirectory(stat)) &&
					file !== "node_modules" &&
					!ignoredPaths.some((ignoredPath) => filePath.includes(ignoredPath))
				) {
					const folderName = file.toLowerCase()
					if (potentialFolders.includes(folderName)) {
						return filePath
					}

					if (!filePath.includes("node_modules")) {
						const subLanguageFolder = await searchForLanguageFolder(filePath, [
							...ignoredPaths,
							...subIgnoredPaths,
						])
						if (subLanguageFolder) {
							return subLanguageFolder
						}
					}
				}
			}

			return undefined
		}

		return await searchForLanguageFolder(args.rootDir, [])
	} catch (error) {
		console.error("Error in getLanguageFolderPath:", error)
		return undefined
	}
}
