import { ConfigPathNotFoundError, createInlang, tryCatch, type InlangInstance, LanguageTag, Message } from "@inlang/app"
import { InlangSdkException } from "./exceptions.js"
import type { NodeishFilesystem } from "@inlang-git/fs"
import { readFile, stat, writeFile } from "node:fs/promises"
import { dedent } from "ts-dedent"
import path from "node:path"
import { pathToFileURL } from 'node:url'
import type { Config as SvelteConfig } from "@sveltejs/kit"
import type { SdkConfig } from '@inlang/sdk-js-plugin'
import { codeToSourceFile } from '../../ast-transforms/utils/js.util.js'
import { findExport } from '../../ast-transforms/utils/exports.js'
import { Node } from 'ts-morph'
import { findDepPkgJsonPath } from "vitefu"
import * as svelteKit from "@sveltejs/kit"

// ------------------------------------------------------------------------------------------------

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => false))

// ------------------------------------------------------------------------------------------------

type VersionString = `${number}.${number}.${number}${string}`

export type TransformConfig = {
	debug: boolean

	sourceLanguageTag: LanguageTag
	languageTags: LanguageTag[]
	readMessages: () => Promise<Message[]>

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

const PATH_TO_CWD = process.cwd()

let appPromise: Promise<TransformConfig> | undefined = undefined

export const initTransformConfig = async (): Promise<TransformConfig> => {
	if (appPromise) return appPromise

	// eslint-disable-next-line no-async-promise-executor
	return (appPromise = new Promise<TransformConfig>(async (resolve) => {
		const instanceResult = await tryCatch(async () =>
			createInlang({ nodeishFs: await getFs(), configPath: "./inlang.config.json" }),
		)

		if (instanceResult.error) {
			if (instanceResult.error instanceof ConfigPathNotFoundError) {
				await createBasicInlangConfig()
				appPromise = undefined
				return resolve(initTransformConfig())
			}

			throw instanceResult.error
		}

		const inlang = instanceResult.data! // TODO: check result type

		await updateSdkPluginVersion(inlang)
		await createDemoResourcesIfNoMessagesExistYet(inlang)

		const settings = getSettings(inlang)

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

		const svelteKitVersion =
			(svelteKit as unknown as { VERSION: string }).VERSION ||
			(await getInstalledVersionOfPackage("@sveltejs/kit"))

		resolve({
			debug: settings.debug,

			sourceLanguageTag: inlang.config().sourceLanguageTag,
			languageTags: inlang.config().languageTags,
			readMessages: async () => inlang.query.messages.getAll(),

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

export const resetApp = () => (appPromise = undefined)

// ------------------------------------------------------------------------------------------------

const getFs = () =>
	import("node:fs/promises").catch(
		() =>
			new Proxy({} as NodeishFilesystem, {
				get: (target, key) => {
					if (key === "then") return Promise.resolve(target)

					return () => {
						throw new InlangSdkException(
							"`node:fs/promises` is not available in the current environment",
						)
					}
				},
			}),
	)

// TODO: use correct modules link
const createBasicInlangConfig = async () =>
	writeFile(
		path.resolve(PATH_TO_CWD, "./inlang.config.json"),
		dedent`
		{
			"sourceLanguageTag": "en",
			"languageTags": ["en", "de"],
			"modules": [
				"../../../../../plugins/json/dist/index.js",
				"../../../../../sdk-js-plugin/dist/index.js",
			],
			"settings": {
				"plugins": {
					"inlang.plugin.json": {
						"options": {
							"pathPattern": "./languages/{{languageTag}}.json"
						}
					}
				}
			}
		}
	`,
	)

// ------------------------------------------------------------------------------------------------

const updateSdkPluginVersion = async (inlang: InlangInstance) => {
	// const inlangConfigAsString = await readFile(inlangConfigFilePath, { encoding: "utf-8" })

	// // this regex detects the new `https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js` as well as
	// // the older https://cdn.jsdelivr.net/npm/@inlang/sdk-js/dist/plugin/index.js url
	// // both urls are also detected with the optional @version identifier
	// const REGEX_PLUGIN_VERSION =
	// 	/https:\/\/cdn\.jsdelivr\.net\/npm\/@inlang\/sdk-js(-plugin)?@?(.*)?\/dist(\/plugin)?\/index\.js/g

	// const newConfig = inlangConfigAsString.replace(
	// 	REGEX_PLUGIN_VERSION,
	// 	`https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin@${version}/dist/index.js`,
	// )

	// if (inlangConfigAsString !== newConfig) {
	// 	console.info(
	// 		`Updating 'inlang.config.json' to use the correct version of '@inlang/sdk-js-plugin' (${version})`,
	// 	)

	// 	await writeFile(inlangConfigFilePath, newConfig)
	// }
}

// ------------------------------------------------------------------------------------------------

const createDemoResourcesIfNoMessagesExistYet = async (inlang: InlangInstance) => {
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

// ------------------------------------------------------------------------------------------------

class InlangSdkConfigException extends InlangSdkException { }

// TODO: automatically add modules if missing ???
function getSettings(inlang: InlangInstance) {
	const settings = inlang.appSpecificApi()["inlang.app.sdkJs"] as SdkConfig | undefined
	if (!settings) {
		throw new InlangSdkConfigException(dedent`
				Invalid config. Make sure to add the 'inlang.plugin.sdkJs' to your 'inlang.config.json' file.
				See https://inlang.com/documentation/sdk/configuration
			`)
	}

	return settings
}

// ------------------------------------------------------------------------------------------------

const shouldContentBePrerendered = async (routesFolder: string) => {
	const filesToLookFor = ["+layout.server.js", "+layout.server.ts", "+layout.js", "+layout.ts"]

	const prerenderExportVCalues = await Promise.all(
		filesToLookFor.map(async (file) => {
			const filePath = path.resolve(routesFolder, file)
			const contents = await readFile(filePath, { encoding: "utf-8" }).catch(() => undefined)
			if (!contents || !contents.trim()) return undefined

			const sourceFile = codeToSourceFile(contents)

			const prerenderExport = findExport(sourceFile, "prerender")
			if (!prerenderExport) {
				return undefined
			}

			if (!Node.isVariableDeclaration(prerenderExport)) {
				return undefined
			}

			return prerenderExport.getInitializer() as Node | undefined
		}),
	)

	return prerenderExportVCalues
		.map(
			(node) =>
				Node.isTrueLiteral(node) ||
				(Node.isStringLiteral(node) && node.getLiteralText() === "auto"),
		)
		.some(Boolean)
}

// ------------------------------------------------------------------------------------------------

const getInstalledVersionOfPackage = async (pkg: string) => {
	const pkgJsonPath = await findDepPkgJsonPath(pkg, PATH_TO_CWD)
	if (!pkgJsonPath) return undefined

	const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf-8" }))
	return pkgJson.version
}
