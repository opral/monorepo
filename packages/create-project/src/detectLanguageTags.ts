import type { NodeishFilesystemSubset } from "@inlang/plugin"

/**
 * Detect languageTags from resources
 *
 * @example const languageTags = await detectLanguageTags({ fs, settings })
 */
export async function detectLanguageTags(args: {
	nodeishFs: NodeishFilesystemSubset
	pathPattern: string | Record<string, string>
	ignore?: string[]
}): Promise<string[]> {
	const languages: string[] = []

	// because of duplication of code the pathArray is eather parsed by th epathPattern object or created by the pathPattern string
	const pathArray: Array<string> =
		typeof args.pathPattern !== "string" ? Object.values(args.pathPattern) : [args.pathPattern]

	// When there are namespaces, this will loop through all namespaces and collect the languages, otherwise it is just one path
	for (const path of pathArray) {
		const [pathBeforeLanguage] = path.split("{languageTag}")
		if (!pathBeforeLanguage) continue

		const parentDirectory = await args.nodeishFs.readdir(pathBeforeLanguage)

		for (const filePath of parentDirectory) {
			//check if file really exists in the dir
			const fileExists = await Promise.resolve(
				args.nodeishFs
					.readFile(path.replace("{languageTag}", filePath.replace(".json", "")))
					.then(() => true)
					.catch(() => false),
			)

			if (fileExists && !args.ignore?.includes(filePath)) {
				languages.push(filePath.replace(".json", ""))
			}
		}
	}

	// Using Set(), an instance of unique values will be created, implicitly using this instance will delete the duplicates.
	return [...new Set(languages)]
}
