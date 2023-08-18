import type { InlangInstance } from '@inlang/app';

export const createDemoResourcesIfNoMessagesExistYet = async (inlang: InlangInstance) => {
	// const resourcesFolder = path.resolve(cwdFolderPath, "languageTags")

	// if (!(await doesPathExist(resourcesFolder))) {
	// 	await mkdir(path.resolve(resourcesFolder))
	// }

	// await writeFile(
	// 	path.resolve(resourcesFolder, "en.json"),
	// 	dedent`
	// 	{
	// 	  "welcome": "Welcome to inlang"
	// 	}
	// `,
	// 	{ encoding: "utf-8" },
	// )

	// await writeFile(
	// 	path.resolve(resourcesFolder, "de.json"),
	// 	dedent`
	// 	{
	// 	  "welcome": "Willkommen bei inlang"
	// 	}
	// `,
	// 	{ encoding: "utf-8" },
	// )
}
