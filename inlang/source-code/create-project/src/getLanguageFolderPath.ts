import type { NodeishFilesystem } from "@lix-js/fs"
const potentialFolders = [
	"language",
	"languages",
	"lang",
	"locale",
	"locales",
	"i18n",
	"translations",
	"translation",
	"resources",
	// Add other potential folder names here
]

export const getLanguageFolderPath = async (args: {
	rootDir: string
	nodeishFs: NodeishFilesystem
	pathJoin: (...args: string[]) => string
}): Promise<string | undefined> => {
	try {
		const searchForLanguageFolder = async (
			dir: string,
			ignoredPaths: string[]
		): Promise<string | undefined> => {
			const files = await args.nodeishFs.readdir(dir)

			const gitignorePath = args.pathJoin(dir, ".gitignore")
			let subIgnoredPaths: string[] = []
			if (await args.nodeishFs.stat(gitignorePath).catch(() => false)) {
				const gitignoreContent = await args.nodeishFs.readFile(gitignorePath, { encoding: "utf-8" })
				subIgnoredPaths = gitignoreContent
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => !line.startsWith("#") && line !== "")
			}

			for (const file of files) {
				const filePath = args.pathJoin(dir, file)
				const stat = await args.nodeishFs.stat(filePath).catch((error) => ({
					error,
				}))

				if (
					!("error" in stat) &&
					stat.isDirectory() &&
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
