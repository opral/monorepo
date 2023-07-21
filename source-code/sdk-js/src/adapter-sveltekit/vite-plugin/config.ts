import { mkdir, readFile, writeFile, stat } from "node:fs/promises"
import { initConfig } from "../../config/index.js"
import { dedent } from "ts-dedent"
import type { InlangConfig } from "@inlang/core/config"
import { testConfigFile } from "@inlang/core/test"
import { initInlangEnvironment, type InlangConfigWithSdkProps } from "../../config/config.js"
import { validateSdkConfig } from "@inlang/sdk-js-plugin"
// @ts-ignore
import { version } from "../../../package.json"
import path from "node:path"
import { pathToFileURL } from "node:url"
import type { Config as SvelteConfig } from "@sveltejs/kit"
import * as svelteKit from "@sveltejs/kit"
import { findDepPkgJsonPath } from "vitefu"
import { InlangSdkException } from "./exceptions.js"

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => false))

type VersionString = `${number}.${number}.${number}`

export type TransformConfig = {
	cwdFolderPath: string
	debug?: boolean
	languageInUrl: boolean
	isStatic: boolean
	rootRoutesFolder: string
	sourceFileName?: string
	sourceMapName?: string
	inlang: InlangConfigWithSdkProps
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

const cwdFolderPath = process.cwd()
const inlangConfigFilePath = path.resolve(cwdFolderPath, "inlang.config.js")

let configPromise: Promise<TransformConfig> | undefined = undefined

export const getTransformConfig = async (): Promise<TransformConfig> => {
	if (configPromise) return configPromise

	// eslint-disable-next-line no-async-promise-executor
	return (configPromise = new Promise<TransformConfig>(async (resolve) => {
		await createInlangConfigIfNotPresentYet()
		await updateSdkPluginVersion()

		// TODO: combine `testConfigFile` and `initConfig` functionality
		const inlangConfigAsString = await readFile(inlangConfigFilePath, { encoding: "utf-8" })

		const [, exception] = await testConfigFile({
			file: inlangConfigAsString,
			env: await initInlangEnvironment(),
		})
		if (exception) {
			throw exception
		}
		const inlangConfigModule = await import(pathToFileURL(inlangConfigFilePath).toString())
		const inlangConfig = await initConfig(inlangConfigModule)

		const { default: svelteConfig } = (await import(
			pathToFileURL(path.resolve(cwdFolderPath, "svelte.config.js")).toString()
		)) as { default: SvelteConfig }
		const files = {
			appTemplate: path.resolve(
				cwdFolderPath,
				svelteConfig.kit?.files?.appTemplate || path.resolve("src", "app.html"),
			),
			routes: path.resolve(
				cwdFolderPath,
				svelteConfig.kit?.files?.routes || path.resolve("src", "routes"),
			),
			serverHooks: path.resolve(
				cwdFolderPath,
				svelteConfig.kit?.files?.hooks?.server || path.resolve("src", "hooks.server"),
			),
		}

		assertConfigWithSdk(inlangConfig)
		inlangConfig.sdk = validateSdkConfig(inlangConfig.sdk)

		const languageInUrl =
			inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === "url") ||
			false

		const rootRoutesFolder = path.resolve(files.routes, languageInUrl ? "[lang]" : "")
		const isStatic =
			(await shouldContentBePrerendered(files.routes)) ||
			(await shouldContentBePrerendered(rootRoutesFolder))

		const usesTypeScript = await doesPathExist(path.resolve(cwdFolderPath, "tsconfig.json"))

		const svelteKitVersion =
			(svelteKit as unknown as { VERSION: string }).VERSION ||
			(await getInstalledVersionOfPackage("@sveltejs/kit"))

		resolve({
			cwdFolderPath,
			debug: !!inlangConfig.sdk?.debug,
			languageInUrl,
			isStatic,
			rootRoutesFolder,
			inlang: inlangConfig,
			svelteKit: {
				version: svelteKitVersion,
				usesTypeScript,
				files,
			},
		})
	}))
}

export const resetConfig = () => (configPromise = undefined)

// ------------------------------------------------------------------------------------------------

class InlangSdkConfigException extends InlangSdkException {}

function assertConfigWithSdk(
	config: InlangConfig | undefined,
): asserts config is InlangConfigWithSdkProps {
	if (!config) {
		throw new InlangSdkConfigException(dedent`
			Could not locate 'inlang.config.js' at the root of your project (${inlangConfigFilePath}).
			Make sure the file exists. You can generate the file using the inlang CLI.
			See https://inlang.com/documentation/apps/inlang-cli
		`)
	}

	if (!("sdk" in config)) {
		throw new InlangSdkConfigException(dedent`
			Invalid config. Make sure to add the 'sdkPlugin' to your 'inlang.config.js' file.
			See https://inlang.com/documentation/sdk/configuration
		`)
	}
}

// ------------------------------------------------------------------------------------------------

const createInlangConfigIfNotPresentYet = async () => {
	const inlangConfigExists = await doesPathExist(inlangConfigFilePath)
	if (inlangConfigExists) return

	await createDemoResources()

	return writeFile(
		inlangConfigFilePath,
		`
/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js"
	)
	const { default: sdkPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js"
	)

	return {
		sourceLanguageTag: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./languages/{language}.json",
			}),
			sdkPlugin({
				languageNegotiation: {
					strategies: [{ type: "localStorage" }]
				}
			}),
		],
	}
}
`,
	)
}

// TODO: do this in a better way https://github.com/inlang/inlang/issues/708
const createDemoResources = async () => {
	const resourcesFolder = path.resolve(cwdFolderPath, "languageTags")

	if (!(await doesPathExist(resourcesFolder))) {
		await mkdir(path.resolve(resourcesFolder))
	}

	await writeFile(
		path.resolve(resourcesFolder, "en.json"),
		dedent`
		{
		  "welcome": "Welcome to inlang"
		}
	`,
		{ encoding: "utf-8" },
	)

	await writeFile(
		path.resolve(resourcesFolder, "de.json"),
		dedent`
		{
		  "welcome": "Willkommen bei inlang"
		}
	`,
		{ encoding: "utf-8" },
	)
}

// ------------------------------------------------------------------------------------------------

const shouldContentBePrerendered = async (routesFolder: string) => {
	const filesToLookFor = ["+layout.server.js", "+layout.server.ts", "+layout.js", "+layout.ts"]

	const modules = (
		await Promise.all(
			filesToLookFor.map((file) => import(path.resolve(routesFolder, file)).catch(() => undefined)),
		)
	).filter(Boolean)

	return modules.map((mod) => [true, "auto"].includes(mod.exports?.prerender)).some(Boolean)
}

// ------------------------------------------------------------------------------------------------

const updateSdkPluginVersion = async () => {
	const inlangConfigAsString = await readFile(inlangConfigFilePath, { encoding: "utf-8" })

	// this regex detects the new `https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js` as well as
	// the older https://cdn.jsdelivr.net/npm/@inlang/sdk-js/dist/plugin/index.js url
	// both urls are also detected with the optional @version identifier
	const REGEX_PLUGIN_VERSION =
		/https:\/\/cdn\.jsdelivr\.net\/npm\/@inlang\/sdk-js(-plugin)?@?(.*)?\/dist(\/plugin)?\/index\.js/g

	const newConfig = inlangConfigAsString.replace(
		REGEX_PLUGIN_VERSION,
		`https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin@${version}/dist/index.js`,
	)

	if (inlangConfigAsString !== newConfig) {
		console.info(
			`Updating 'inlang.config.js' to use the correct version of '@inlang/sdk-js-plugin' (${version})`,
		)

		await writeFile(inlangConfigFilePath, newConfig)
	}
}

// ------------------------------------------------------------------------------------------------

const getInstalledVersionOfPackage = async (pkg: string) => {
	const pkgJsonPath = await findDepPkgJsonPath(pkg, cwdFolderPath)
	if (!pkgJsonPath) return undefined

	const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf-8" }))
	return pkgJson.version
}
