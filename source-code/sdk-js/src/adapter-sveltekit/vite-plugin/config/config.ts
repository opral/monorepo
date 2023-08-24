import { ConfigPathNotFoundError, openInlangProject, LanguageTag, Message } from "@inlang/app"
import { InlangSdkException } from "../exceptions.js"
import path, { resolve } from "node:path"
import type { Config as SvelteConfig } from "@sveltejs/kit"
import type { SdkConfig } from "@inlang/sdk-js-plugin"
import { getSvelteKitVersion } from "./utils/getSvelteKitVersion.js"
import { shouldContentBePrerendered } from "./utils/shouldContentBePrerendered.js"
import { updateSdkModuleVersion } from "./utils/updateSdkModuleVersion.js"
import { getSettings } from "./utils/getSettings.js"
import { createBasicInlangConfig } from "./utils/createBasicInlangConfig.js"
import { createDemoResourcesIfNoMessagesExistYet } from "./utils/createDemoResourcesIfNoMessagesExistYet.js"
import { doesPathExist } from "./utils/utils.js"
import { getNodeishFs } from "./utils/getNodeishFs.js"
import { createImport } from "@inlang/module"

type VersionString = `${number}.${number}.${number}${string}`

export type TransformConfig = {
	debug: boolean

	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	messages: () => Message[]

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
export const PATH_TO_INLANG_CONFIG = resolve(PATH_TO_CWD, "./inlang.config.json")
export const PATH_TO_SVELTE_CONFIG = resolve(PATH_TO_CWD, "./svelte.config.js")

let transformConfig: Promise<TransformConfig> | undefined = undefined

export const initTransformConfig = async (): Promise<TransformConfig> => {
	if (transformConfig) return transformConfig

	const nodeishFs = await getNodeishFs()

	// eslint-disable-next-line no-async-promise-executor
	return (transformConfig = new Promise<TransformConfig>(async (resolve, reject) => {
		const inlang = await openInlangProject({ nodeishFs, configPath: PATH_TO_INLANG_CONFIG })

		const errors = inlang.errors()
		if (errors.length) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const error = errors[0]!
			if (error instanceof ConfigPathNotFoundError) {
				await createBasicInlangConfig(nodeishFs)
				resetTransformConfig()
				return resolve(initTransformConfig())
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return reject(error)
		}

		await updateSdkModuleVersion(inlang)
		await createDemoResourcesIfNoMessagesExistYet(inlang)

		const settings = getSettings(inlang)
		if (!settings) {
			resetTransformConfig()
			return resolve(initTransformConfig())
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
					error as Error,
				)
			}
		})) as { default: SvelteConfig | InlangSdkException }
		if (svelteConfig instanceof InlangSdkException) {
			return reject(svelteConfig)
		}

		const files = {
			appTemplate: path.resolve(
				PATH_TO_CWD,
				svelteConfig.kit?.files?.appTemplate || path.resolve("src", "app.html"),
			),
			routes: path.resolve(
				PATH_TO_CWD,
				svelteConfig.kit?.files?.routes || path.resolve("src", "routes"),
			),
			serverHooks: path.resolve(
				PATH_TO_CWD,
				svelteConfig.kit?.files?.hooks?.server || path.resolve("src", "hooks.server"),
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
			path.resolve(PATH_TO_CWD, "tsconfig.json"),
		)

		const svelteKitVersion = await getSvelteKitVersion()

		resolve({
			debug: settings.debug,

			sourceLanguageTag: inlang.config().sourceLanguageTag,
			languageTags: inlang.config().languageTags,
			messages: () => Object.values(inlang.query.messages.getAll()),

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

export const resetTransformConfig = () => (transformConfig = undefined)
