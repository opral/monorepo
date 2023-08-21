import { ConfigPathNotFoundError, createInlang, tryCatch, LanguageTag, Message } from "@inlang/app"
import { InlangSdkException } from "../exceptions.js"
import path, { resolve } from "node:path"
import type { Config as SvelteConfig } from "@sveltejs/kit"
import type { SdkConfig } from '@inlang/sdk-js-plugin'
import { getSvelteKitVersion } from './utils/getSvelteKitVersion.js'
import { shouldContentBePrerendered } from './utils/shouldContentBePrerendered.js'
import { updateSdkModuleVersion } from './utils/updateSdkModuleVersion.js'
import { getSettings } from './utils/getSettings.js'
import { createBasicInlangConfig } from './utils/createBasicInlangConfig.js'
import { createDemoResourcesIfNoMessagesExistYet } from './utils/createDemoResourcesIfNoMessagesExistYet.js'
import { doesPathExist } from './utils/utils.js'
import { getNodeishFs } from './utils/getNodeishFs.js'

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

let transformConfig: Promise<TransformConfig> | undefined = undefined

export const initTransformConfig = async (): Promise<TransformConfig> => {
	if (transformConfig) return transformConfig

	// eslint-disable-next-line no-async-promise-executor
	return (transformConfig = new Promise<TransformConfig>(async (resolve, reject) => {
		const { data: inlang, error: createInlangError } = await tryCatch(async () =>
			createInlang({ nodeishFs: await getNodeishFs(), configPath: PATH_TO_INLANG_CONFIG })
		)
		if (createInlangError) {
			if (createInlangError instanceof ConfigPathNotFoundError) {
				await createBasicInlangConfig()
				transformConfig = undefined
				return resolve(initTransformConfig())
			}

			return reject(createInlangError)
		}

		if (inlang.errors.length) {
			return reject(inlang.errors)
		}

		await updateSdkModuleVersion(inlang)
		await createDemoResourcesIfNoMessagesExistYet(inlang)

		const settings = getSettings(inlang)
		if (!settings) {
			transformConfig = undefined
			return resolve(initTransformConfig())
		}

		const { default: svelteConfig } = (await import(/* @vite-ignore */
			/*pathToFileURL*/(path.resolve(PATH_TO_CWD, "svelte.config.js")).toString()
		).catch((error: unknown) => {
			throw new InlangSdkException('Could not find svelte.config.js file.', error as Error)
		})) as { default: SvelteConfig }

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
			settings.languageNegotiation.strategies.some(({ type }) => type === "url") ||
			false

		const rootRoutesFolder = path.resolve(files.routes, languageInUrl ? "[lang]" : "")
		const isStatic =
			(await shouldContentBePrerendered(files.routes)) ||
			(await shouldContentBePrerendered(rootRoutesFolder))

		const usesTypeScript = await doesPathExist(path.resolve(PATH_TO_CWD, "tsconfig.json"))

		const svelteKitVersion = await getSvelteKitVersion()

		resolve({
			debug: settings.debug,

			sourceLanguageTag: inlang.config().sourceLanguageTag,
			languageTags: inlang.config().languageTags,
			messages: () => inlang.query.messages.getAll(),

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
