import { writeFile, mkdir, readdir, rename } from "node:fs/promises"
import { dirname, join } from "node:path"
import type { ViteDevServer, Plugin } from "vite"
import { TransformConfig, getTransformConfig, resetConfig } from "./config.js"
import { doesPathExist } from "./config.js"
import { transformCode } from "./transforms/index.js"

type FileType =
	| "hooks.server.js"
	| "[language].json"
	| "+layout.server.js"
	| "+layout.js"
	| "+layout.svelte"
	| "+page.server.js"
	| "+page.js"
	| "+page.svelte"
	| "*.js"
	| "*.svelte"

export type FileInformation = {
	type: FileType
	root: boolean
}

const getFileInformation = (config: TransformConfig, id: string): FileInformation | undefined => {
	if (!id.startsWith(config.srcFolder)) return undefined

	const path = id.replace(config.srcFolder, "")

	const dir = dirname(path)
	const root = dir.endsWith("/routes")

	if (path === "/hooks.server.js" || path === "/hooks.server.ts") {
		return {
			type: "hooks.server.js",
			root: true,
		}
	}

	if (
		path === "/routes/inlang/[language].json/+server.js" ||
		path === "/routes/inlang/[language].json/+server.ts"
	) {
		return {
			type: "[language].json",
			root: true,
		}
	}

	if (path.endsWith("/+layout.server.js") || path.endsWith("/+layout.server.ts")) {
		return {
			type: "+layout.server.js",
			root,
		}
	}
	if (path.endsWith("/+layout.js") || path.endsWith("/+layout.ts")) {
		return {
			type: "+layout.js",
			root,
		}
	}
	if (path.endsWith("/+layout.svelte")) {
		return {
			type: "+layout.svelte",
			root,
		}
	}

	if (path.endsWith("/+page.server.js") || path.endsWith("/+page.server.ts")) {
		return {
			type: "+page.server.js",
			root,
		}
	}
	if (path.endsWith("/+page.js") || path.endsWith("/+page.ts")) {
		return {
			type: "+page.js",
			root,
		}
	}
	if (path.endsWith("/+page.svelte")) {
		return {
			type: "+page.svelte",
			root,
		}
	}

	if (path.endsWith(".js") || path.endsWith(".ts")) {
		return {
			type: "*.js",
			root: false,
		}
	}
	if (path.endsWith(".svelte")) {
		return {
			type: "*.svelte",
			root: false,
		}
	}

	return undefined
}

// ------------------------------------------------------------------------------------------------

const createFilesIfNotPresent = async (config: TransformConfig) => {
	const preferredFileEnding = config.isTypeScriptProject ? 'ts' : 'js'

	const getPathForFileType = (fileType: FileType, fileEnding: 'ts' | 'js' = preferredFileEnding) => {
		switch (fileType) {
			case 'hooks.server.js': return config.srcFolder + `/hooks.server.${fileEnding}`
			case '[language].json': return config.srcFolder + `/routes/inlang/[language].json/+server.${fileEnding}`
			case '+layout.server.js': return config.srcFolder + `/routes/+layout.server.${fileEnding}`
			case '+layout.js': return config.srcFolder + `/routes/+layout.${fileEnding}`
			case '+layout.svelte': return config.srcFolder + `/routes/+layout.svelte`
			case '+page.server.js': return config.srcFolder + `/routes/+page.server.${fileEnding}`
			case '+page.js': return config.srcFolder + `/routes/+page.${fileEnding}`
			case '+page.svelte': return config.srcFolder + `/routes/+page.svelte`
		}

		throw Error('not implemented')
	}

	const doesFileOfTypeExist = async (fileType: FileType): Promise<boolean> => {
		const files = fileType.endsWith('.svelte')
			? [getPathForFileType(fileType)]
			: [
				getPathForFileType(fileType, 'js'),
				getPathForFileType(fileType, 'ts'),
			]

		return (await Promise.all(files.map(file => doesPathExist(file)))).some((result) => result)
	}

	const filesTypesToCreate = [
		`hooks.server.js`,
		`[language].json`,
		`+layout.server.js`,
		`+layout.js`,
		'+layout.svelte',
		...(config.isStatic && config.languageInUrl ? [
			`+page.js`,
			'+page.svelte',
		]satisfies FileType[] : [])
	]satisfies FileType[]

	// eslint-disable-next-line no-async-promise-executor
	const results = await Promise.all(
		filesTypesToCreate.map(
			(fileType) =>
				// eslint-disable-next-line no-async-promise-executor
				new Promise<boolean>(async (resolve) => {
					if ((await doesFileOfTypeExist(fileType))) {
						return resolve(false)
					}

					const path = getPathForFileType(fileType)
					await mkdir(dirname(path), { recursive: true }).catch(() => undefined)
					// TODO: improve robustness by using something like `vite-plugin-restart` that recreates those file if they were deleted
					const message = 'This file was created by inlang. It is needed in order to circumvent a current limitation of SvelteKit. Please do not delete it (inlang will recreate it if needed).'
					await writeFile(path, path.endsWith('.svelte') ? `<!-- ${message} -->` : `// ${message}`)

					resolve(true)
				}),
		),
	)

	// TODO: remove not needed files if config changes

	// returns true if a new file was created
	return results.some((result) => result)
}

const moveFiles = async (srcDir: string, destDir: string) =>
	Promise.all(
		(await readdir(srcDir)).map(async (file) => {
			const destFile = join(destDir, file)
			await mkdir(dirname(destFile), { recursive: true }).catch(() => undefined)
			await rename(join(srcDir, file), destFile)
		}),
	)

const moveExistingRoutesIntoSubfolder = async (config: TransformConfig) =>
	moveFiles(config.srcFolder + "/routes", config.rootRoutesFolder)

// ------------------------------------------------------------------------------------------------

let viteServer: ViteDevServer | undefined

export const plugin = () => {
	return {
		name: "vite-plugin-inlang-sdk-js-sveltekit",
		// makes sure we run before vite-plugin-svelte
		enforce: "pre",

		configureServer(server) {
			viteServer = server as unknown as ViteDevServer
		},

		config() {
			return {
				ssr: {
					// makes sure that `@inlang/sdk-js` get's transformed by vite in order
					// to be able to use `SvelteKit`'s `$app` aliases
					noExternal: ["@inlang/sdk-js"],
				},
			}
		},

		async buildStart() {
			const config = await getTransformConfig()

			if (!config.hasAlreadyBeenInitialized) {
				// TODO: check if no git changes are inside the src folder. If there are changes then throw an error saying that the files should be committed before we make changes to them
				await moveExistingRoutesIntoSubfolder(config)
			}

			const hasCreatedANewFile = await createFilesIfNotPresent(config)

			if (hasCreatedANewFile) {
				setTimeout(() => {
					resetConfig()
					viteServer && viteServer.restart()
				}, 1000) // if the server immediately get's restarted, then you would not be able to kill the process with CTRL + C; It seems that delaying the restart fixes this issue
			}
		},

		async transform(code, id) {
			const config = await getTransformConfig()

			const fileInformation = getFileInformation(config, id)
			// eslint-disable-next-line unicorn/no-null
			if (!fileInformation) return null

			return transformCode(config, code, fileInformation)
		},
	} satisfies Plugin
}
