import { tryCatch } from "@inlang/result"
import type { NodeishFilesystem } from "@lix-js/fs"

/**
 * Migrates to the new project directory structure
 * https://github.com/inlang/monorepo/issues/1678
 */
export const maybeMigrateToDirectory = async (args: {
	fs: NodeishFilesystem
	projectPath: string
}) => {
	// already migrated
	if (args.projectPath.endsWith(".inlang.json") === false) {
		return
	}
	const settingsFile = await tryCatch(() =>
		args.fs.readFile(args.projectPath, { encoding: "utf-8" })
	)
	// the settings file does not exist or something else is wrong, let loadProject handle it
	if (settingsFile.error) {
		return
	}
	// ./project.inlang.json -> ./project.inlang
	const directoryPath = args.projectPath.replace(/\.json$/, "")
	// (Should be OK) naively assuming that the directory does not exist if stat throws
	const { error: directoryDoesNotExist } = await tryCatch(() => args.fs.stat(directoryPath))
	if (directoryDoesNotExist) {
		await args.fs.mkdir(directoryPath)
	}
	await args.fs.writeFile(`${directoryPath}/settings.json`, settingsFile.data)
	await args.fs.writeFile(args.projectPath.replace(/\.json$/, ".README.md"), readme)
}

const readme = `
# DELETE THE \`project.inlang.json\` FILE

The \`project.inlang.json\` file is now contained in a project directory e.g. \`project.inlang/settings.json\`.


## What you need to do

1. Update the inlang CLI (if you use it) to use the new path \`project.inlang\` instead of \`project.inlang.json\`.
2. Delete the \`project.inlang.json\` file.


## Why is this happening?

See this RFC https://docs.google.com/document/d/1OYyA1wYfQRbIJOIBDliYoWjiUlkFBNxH_U2R4WpVRZ4/edit#heading=h.pecv6xb7ial6.

- Monorepo support https://github.com/inlang/monorepo/discussions/258. 
- Required for many other future features like caching, first class offline support, and more. 
- Stablize the inlang project format.
`
