import { writeFile, mkdir } from "node:fs/promises"
import path, { dirname, normalize } from "node:path"
import { dedent } from 'ts-dedent'
import type { ViteDevServer, Plugin } from "vite"
import { InlangError } from '../../config/config.js'
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

const scriptExtensions = ['.js', '.ts']

const getFileInformation = (config: TransformConfig, rawId: string): FileInformation | undefined => {
	const id = normalize(rawId)

	if (!id.startsWith(config.srcFolder)) return undefined

	const filePath = id.replace(config.srcFolder, "")

	const { dir, name, ext } = path.parse(filePath)

	const root = dir === `${path.sep}routes`

	if (dir === path.sep && name === 'hooks.server' && scriptExtensions.includes(ext)) {
		return {
			type: "hooks.server.js",
			root: true,
		}
	}

	if (dir === `${path.sep}routes${path.sep}inlang${path.sep}[language].json` && name === '+server' && scriptExtensions.includes(ext)) {
		return {
			type: "[language].json",
			root: true,
		}
	}

	if (name === "+layout.server" && scriptExtensions.includes(ext)) {
		return {
			type: "+layout.server.js",
			root,
		}
	}
	if (name === "+layout" && scriptExtensions.includes(ext)) {
		return {
			type: "+layout.js",
			root,
		}
	}
	if (name === "+layout" && ext === '.svelte') {
		return {
			type: "+layout.svelte",
			root,
		}
	}

	if (name === "+page.server" && scriptExtensions.includes(ext)) {
		return {
			type: "+page.server.js",
			root,
		}
	}
	if (name === "+page" && scriptExtensions.includes(ext)) {
		return {
			type: "+page.js",
			root,
		}
	}
	if (name === "+page" && ext === '.svelte') {
		return {
			type: "+page.svelte",
			root,
		}
	}

	if (scriptExtensions.includes(ext)) {
		return {
			type: "*.js",
			root: false,
		}
	}
	if (ext === '.svelte') {
		return {
			type: "*.svelte",
			root: false,
		}
	}

	return undefined
}

// ------------------------------------------------------------------------------------------------

const createFilesIfNotPresent = async (config: TransformConfig) => {
	const preferredFileEnding = config.svelteKit.usesTypeScript ? 'ts' : 'js'

	const getPathForFileType = (fileType: FileType, fileEnding: 'ts' | 'js' = preferredFileEnding) => {
		switch (fileType) {
			case 'hooks.server.js': return path.resolve(config.srcFolder, `hooks.server.${fileEnding}`)
			case '[language].json': return path.resolve(config.srcFolder, 'routes', 'inlang', '[language].json', `+server.${fileEnding}`)
			case '+layout.server.js': return path.resolve(config.srcFolder, 'routes', `+layout.server.${fileEnding}`)
			case '+layout.js': return path.resolve(config.srcFolder, 'routes', `+layout.${fileEnding}`)
			case '+layout.svelte': return path.resolve(config.srcFolder, 'routes', `+layout.svelte`)
			case '+page.server.js': return path.resolve(config.srcFolder, 'routes', `+page.server.${fileEnding}`)
			case '+page.js': return path.resolve(config.srcFolder, 'routes', `+page.${fileEnding}`)
			case '+page.svelte': return path.resolve(config.srcFolder, 'routes', `+page.svelte`)
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
					const message = dedent`
						This file was created by inlang.
						It is needed in order to circumvent a current limitation of SvelteKit. See https://github.com/inlang/inlang/issues/647
						You can remove this comment and modify the file as you like. We just need to make sure it exists.
						Please do not delete it (inlang will recreate it if needed).
					`
					await writeFile(path, path.endsWith('.svelte') ? `<!-- ${message} -->` : `/* ${message} */`)

					resolve(true)
				}),
		),
	)

	// TODO: remove not needed files if config changes

	// returns true if a new file was created
	return results.some((result) => result)
}

// ------------------------------------------------------------------------------------------------

let viteServer: ViteDevServer | undefined

const virtualModuleId = 'virtual:inlang-static'
const resolvedVirtualModuleId = '\0' + virtualModuleId

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

		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			}

			return
		},

		async load(id) {
			const config = await getTransformConfig()
			if (id === resolvedVirtualModuleId) {
				return dedent`
					export const referenceLanguage = ${JSON.stringify(config.inlang.referenceLanguage)}
					export const languages = ${JSON.stringify(config.inlang.languages)}
					export const resources = ${JSON.stringify(await config.inlang.readResources({ config: config.inlang }))}
				`
			}

			return
		},

		async buildStart() {
			const config = await getTransformConfig()

			if (!(await doesPathExist(config.rootRoutesFolder))) {
				throw new InlangError(dedent`

					Could not find the folder '${config.rootRoutesFolder.replace(config.srcFolder, '')}'.
					It is needed in order to circumvent a current limitation of SvelteKit. See https://github.com/inlang/inlang/issues/647.
					Please create the folder and move all existing route files into it.

				`)
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

			const transformedCode = await transformCode(config, code, fileInformation)
			if (config.debug) {
				const filePath = id.replace(config.srcFolder, '')
				console.info(dedent`
					-- INLANG DEBUG START-----------------------------------------------------------

					transformed '${fileInformation.type}' file: '${filePath}'

					-- INPUT -----------------------------------------------------------------------

					${code}

					-- OUTPUT ----------------------------------------------------------------------

					${transformedCode}

					-- INLANG DEBUG END ------------------------------------------------------------
				`)
			}

			return transformedCode
				.replaceAll('languages: languages', 'languages')
				.replaceAll('language: language', 'language')
				.replaceAll('i: i', 'i')
		},
	} satisfies Plugin
}
