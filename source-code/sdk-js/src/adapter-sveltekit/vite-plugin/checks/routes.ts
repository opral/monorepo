import { mkdir, writeFile } from "node:fs/promises"
import path, { dirname } from "node:path"
import { dedent } from "ts-dedent"
import { doesPathExist, type TransformConfig } from "../config.js"
import type { FileType } from "../fileInformation.js"
import { InlangException } from '../../../exceptions.js'
import { InlangSdkException } from '../exceptions.js'

export const assertRoutesFolderPathExists = async (config: TransformConfig) => {
	if (!(await doesPathExist(config.rootRoutesFolder))) {
		throw new InlangException(dedent`

			Could not find the folder '${config.rootRoutesFolder.replace(config.cwdFolderPath, "")}'.
			It is needed in order to circumvent a current limitation of SvelteKit. See https://github.com/inlang/inlang/issues/647.
			Please create the folder and move all existing route files into it.

		`)
	}
}

// --------------------------------------------------------------------------------------------------------------------

export const assertNecessaryFilesArePresent = async (config: TransformConfig) => {
	const preferredFileEnding = config.svelteKit.usesTypeScript ? "ts" : "js"

	const getPathForFileType = (
		fileType: FileType,
		fileEnding: "ts" | "js" = preferredFileEnding,
	) => {
		switch (fileType) {
			case "hooks.server.js":
				return `${config.svelteKit.files.serverHooks}.${fileEnding}`
			case "[language].json":
				return path.resolve(
					config.svelteKit.files.routes,
					"inlang",
					"[language].json",
					`+server.${fileEnding}`,
				)
			case "+layout.server.js":
				return path.resolve(config.svelteKit.files.routes, `+layout.server.${fileEnding}`)
			case "+layout.js":
				return path.resolve(config.svelteKit.files.routes, `+layout.${fileEnding}`)
			case "+layout.svelte":
				return path.resolve(config.svelteKit.files.routes, `+layout.svelte`)
			case "+page.server.js":
				return path.resolve(config.svelteKit.files.routes, `+page.server.${fileEnding}`)
			case "+page.js":
				return path.resolve(config.svelteKit.files.routes, `+page.${fileEnding}`)
			case "+page.svelte":
				return path.resolve(config.svelteKit.files.routes, `+page.svelte`)
		}

		throw new InlangSdkException(`Could not find path for file type '${fileType}'`)
	}

	const doesFileOfTypeExist = async (fileType: FileType): Promise<boolean> => {
		const files = fileType.endsWith(".svelte")
			? [getPathForFileType(fileType)]
			: [getPathForFileType(fileType, "js"), getPathForFileType(fileType, "ts")]

		return (await Promise.all(files.map((file) => doesPathExist(file)))).some((result) => result)
	}

	const filesTypesToCreate = [
		`hooks.server.js`,
		`[language].json`,
		`+layout.server.js`,
		`+layout.js`,
		"+layout.svelte",
		...(config.isStatic && config.languageInUrl
			? ([`+page.js`, "+page.svelte"] satisfies FileType[])
			: []),
	] satisfies FileType[]

	// eslint-disable-next-line no-async-promise-executor
	const results = await Promise.all(
		filesTypesToCreate.map(
			(fileType) =>
				// eslint-disable-next-line no-async-promise-executor
				new Promise<boolean>(async (resolve) => {
					if (await doesFileOfTypeExist(fileType)) {
						return resolve(false)
					}

					const path = getPathForFileType(fileType)
					await mkdir(dirname(path), { recursive: true }).catch(() => undefined)
					// TODO: improve robustness by using something like `vite-plugin-restart` that recreates those file if they were deleted
					const message = dedent`
						This file was created by inlang.
						It is needed in order to circumvent a current limitation of SvelteKit. See https://github.com/inlang/inlang/issues/647
						You can remove this comment and modify the file as you like. We just need to make sure it exists.
						Please do not delete it (inlang will recreate it if needed).
					`
					await writeFile(
						path,
						path.endsWith(".svelte") ? `<!-- ${message} -->` : `/* ${message} */`,
					)

					resolve(true)
				}),
		),
	)

	// TODO: remove not needed files if config changes

	// returns true if a new file was created
	return results.some((result) => result)
}
