import path from "node:path"
import * as vscode from "vscode"
import type { FileSystem } from "./fs/types.js"
import { potentialFolders } from "./potentialFolders.js"

export const getLanguageFolderPath = async (
	rootDir: string,
	fileSystem: FileSystem,
): Promise<string | undefined> => {
	try {
		const searchForLanguageFolder = async (
			dir: string,
			ignoredPaths: string[],
		): Promise<string | undefined> => {
			const files = await fileSystem.readDirectory(dir)

			// Check if .gitignore exists
			const gitignorePath = path.join(dir, ".gitignore")
			let subIgnoredPaths: string[] = []
			if (await fileSystem.exists(gitignorePath)) {
				const gitignoreContent = await fileSystem.readFile(gitignorePath, "utf-8")
				subIgnoredPaths = gitignoreContent
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => !line.startsWith("#") && line !== "")
			}

			for (const [file] of files) {
				const filePath = path.join(dir, file)
				const stat = await fileSystem.stat(filePath)

				if (
					stat &&
					// @ts-ignore
					(stat.isDirectory() || stat.type === vscode.FileType.Directory) &&
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

		return await searchForLanguageFolder(rootDir, [])
	} catch (error) {
		console.error(`Error in getLanguageFolderPath:`, error)
		return undefined
	}
}
