import {
	ProjectFilePathNotFoundError,
	loadProject,
	LanguageTag,
	Message,
	createImport,
} from "@inlang/sdk"
import { InlangSdkException } from "../exceptions.js"
import path, { resolve } from "node:path"
import type { Config as SvelteConfig } from "@sveltejs/kit"
import type { SdkConfig } from "../../../settings.js"
import { getSvelteKitVersion } from "./utils/getSvelteKitVersion.js"
import { shouldContentBePrerendered } from "./utils/shouldContentBePrerendered.js"
import { getSettings } from "./utils/getSettings.js"
import { doesPathExist } from "./utils/utils.js"
import { getNodeishFs } from "./utils/getNodeishFs.js"
import { openRepository, findRepoRoot } from "@lix-js/client"

type VersionString = `${number}.${number}.${number}${string}`

export type VirtualModule = {
	debug: boolean

	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	messages: ReadonlyArray<Message>

	cwdFolderPath: string
	options: {
		rootRoutesFolder: string
		languageInUrl: boolean
		isStatic: boolean
		resourcesCache: SdkConfig["resources"]["cache"]
		excludedRoutes: SdkConfig["routing"]["exclude"]
	}

	svelteKit: {
		version: VersionString | undefined
		usesTypeScript: boolean
		files: {
			appTemplate: string
			routes: string
			serverHooks: string
		}
	}
}

export const PATH_TO_CWD = process.cwd()
export const PATH_TO_INLANG_CONFIG = resolve(PATH_TO_CWD, "./project.inlang.json")
export const PATH_TO_SVELTE_CONFIG = resolve(PATH_TO_CWD, "./svelte.config.js")

let VirtualModule: Promise<VirtualModule> | undefined = undefined

export const initVirtualModule = async (): Promise<VirtualModule> => {
	if (VirtualModule) return VirtualModule

	const nodeishFs = await getNodeishFs()

	// eslint-disable-next-line no-async-promise-executor
	return (VirtualModule = new Promise<VirtualModule>(async (resolve, reject) => {
		const repoRoot = await findRepoRoot({ nodeishFs, path: PATH_TO_CWD })

		const repo = await openRepository(repoRoot || process.cwd(), {
			nodeishFs,
		})
		const inlang = await loadProject({ repo, projectPath: PATH_TO_INLANG_CONFIG })

		const errors = inlang.errors()
		if (errors.length) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const error = errors[0]!
			if (error instanceof ProjectFilePathNotFoundError) {
				resetTransformConfig()
				return resolve(initVirtualModule())
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return reject(error)
		}

		const settings = getSettings(inlang)
		if (!settings) {
			resetTransformConfig()
			return resolve(initVirtualModule())
		}
		if (settings instanceof InlangSdkException) {
			return reject(settings)
		}

		// we can't use `import` in tests to import something from the virtual file system
		// so we need to use `createImport` instead
		const { default: svelteConfig } = (await (import.meta.env?.TEST
			? createImport({ readFile: nodeishFs.readFile, fetch })(PATH_TO_SVELTE_CONFIG)
			: import(/* @vite-ignore */ PATH_TO_SVELTE_CONFIG)
		).catch((error: unknown) => {
			return {
				default: new InlangSdkException(
					`Could not find 'svelte.config.js' file (${PATH_TO_SVELTE_CONFIG})`,
					error as Error
				),
			}
		})) as { default: SvelteConfig | InlangSdkException }
		if (svelteConfig instanceof InlangSdkException) {
			return reject(svelteConfig)
		}

		const files = {
			appTemplate: path.resolve(
				PATH_TO_CWD,
				svelteConfig.kit?.files?.appTemplate || path.resolve("src", "app.html")
			),
			routes: path.resolve(
				PATH_TO_CWD,
				svelteConfig.kit?.files?.routes || path.resolve("src", "routes")
			),
			serverHooks: path.resolve(
				PATH_TO_CWD,
				svelteConfig.kit?.files?.hooks?.server || path.resolve("src", "hooks.server")
			),
		}

		const languageInUrl =
			settings.languageNegotiation.strategies.some(({ type }) => type === "url") || false

		const rootRoutesFolder = path.resolve(files.routes, languageInUrl ? "[lang]" : "")
		const isStatic =
			(await shouldContentBePrerendered(nodeishFs, files.routes)) ||
			(await shouldContentBePrerendered(nodeishFs, rootRoutesFolder))

		const usesTypeScript = await doesPathExist(
			nodeishFs,
			path.resolve(PATH_TO_CWD, "tsconfig.json")
		)

		const svelteKitVersion = await getSvelteKitVersion()

		resolve({
			debug: settings.debug,

			sourceLanguageTag: inlang.settings()!.sourceLanguageTag,
			languageTags: inlang.settings()!.languageTags,
			messages: inlang.query.messages.getAll(),

			cwdFolderPath: PATH_TO_CWD,
			options: {
				rootRoutesFolder,
				languageInUrl,
				isStatic,
				resourcesCache: settings.resources.cache,
				excludedRoutes: settings.routing.exclude,
			},

			svelteKit: {
				version: svelteKitVersion,
				usesTypeScript,
				files,
			},
		})
	}))
}

export const resetTransformConfig = () => (VirtualModule = undefined)
