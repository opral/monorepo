import { loadFile, type ProxifiedModule } from "magicast"
import { mkdir, readFile, writeFile, stat } from "node:fs/promises"
import { initConfig } from '../../config/index.js'
import { dedent } from 'ts-dedent'
import type { InlangConfig } from '@inlang/core/config'
import { testConfigFile } from '@inlang/core/test'
import { initInlangEnvironment, InlangConfigWithSdkProps } from '../../config/config.js'
import { validateSdkConfig } from '@inlang/sdk-js-plugin'
import { promisify } from 'node:util'
import { exec as execCb } from 'node:child_process'

const exec = promisify(execCb);

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => false))

export type TransformConfig = {
	debug?: boolean
	languageInUrl: boolean
	isStatic: boolean
	srcFolder: string
	rootRoutesFolder: string
	sourceFileName?: string
	sourceMapName?: string
	isTypeScriptProject: boolean
}

const cwd = process.cwd()

let configPromise: Promise<TransformConfig> | undefined = undefined

export const getTransformConfig = async (): Promise<TransformConfig> => {
	if (configPromise) return configPromise

	// eslint-disable-next-line no-async-promise-executor
	return configPromise = new Promise<TransformConfig>(async (resolve) => {
		const srcFolder = cwd + "/src"
		const routesFolder = srcFolder + "/routes"

		await createInlangConfigIfNotPresentYet()
		await updateSdkPluginVersion()

		// TODO: combine `testConfigFile` and `initConfig` functionality
		const inlangConfigAsString = await readFile(cwd + "/inlang.config.js", { encoding: "utf-8" })
		const [, exception] = await testConfigFile({
			file: inlangConfigAsString,
			env: await initInlangEnvironment()
		})
		if (exception) {
			throw exception
		}

		const inlangConfigModule = await import(cwd + "/inlang.config.js")
		const inlangConfig = await initConfig(inlangConfigModule)

		assertConfigWithSdk(inlangConfig)
		inlangConfig.sdk = validateSdkConfig(inlangConfig.sdk)

		const languageInUrl = inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === 'url') || false

		const rootRoutesFolder = routesFolder + "/" + (languageInUrl ? "[lang]" : "")
		const isStatic = await shouldContentBePrerendered(routesFolder) || await shouldContentBePrerendered(rootRoutesFolder)

		const isTypeScriptProject = await doesPathExist(cwd + '/tsconfig.json')

		resolve({
			debug: !!inlangConfig.sdk?.debug,
			languageInUrl,
			isStatic,
			srcFolder,
			rootRoutesFolder,
			isTypeScriptProject,
		})
	})
}

export const resetConfig = () => configPromise = undefined

// ------------------------------------------------------------------------------------------------

class InlangSdkConfigError extends Error { }

function assertConfigWithSdk(config: InlangConfig | undefined): asserts config is InlangConfigWithSdkProps {
	if (!config) {
		throw new InlangSdkConfigError('Could not find `inlang.config.js` in the root of your project.`')
	}

	if (!('sdk' in config)) {
		// TODO: link to docs
		throw new InlangSdkConfigError('The `sdk` property is missing in your `inlang.config.js` file.`. Make sure to use the `sdkPlugin` in your `inlang.config.js` file.')
	}
}

// ------------------------------------------------------------------------------------------------

const createInlangConfigIfNotPresentYet = async () => {
	const inlangConfigPath = cwd + "/inlang.config.js"
	const inlangConfigExists = await doesPathExist(inlangConfigPath)
	if (inlangConfigExists) return

	await createDemoResources()

	return writeFile(inlangConfigPath, `
/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js"
	)
	const { default: sdkPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js"
	)

	return {
		referenceLanguage: "en",
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
`)
}

// TODO: do this in a better way
const createDemoResources = async () => {
	if (!await doesPathExist(cwd + '/languages')) {
		await mkdir(cwd + '/languages')
	}

	await writeFile(cwd + '/languages/en.json', dedent`
		{
		  "welcome": "Welcome to inlang"
		}
	`, { encoding: 'utf-8' })

	await writeFile(cwd + '/languages/de.json', dedent`
		{
		  "welcome": "Willkommen bei inlang"
		}
	`, { encoding: 'utf-8' })
}

// ------------------------------------------------------------------------------------------------

const shouldContentBePrerendered = async (routesFolder: string) => {
	const filesToLookFor = [
		'+layout.server.js',
		'+layout.server.ts',
		'+layout.js',
		'+layout.ts',
	]

	const modules = (await Promise.all(
		filesToLookFor.map(file => loadFile(routesFolder + `/${file}`).catch(() => undefined))
	))
		.filter(Boolean) as ProxifiedModule<any>[]

	return modules.map(mod => [true, 'auto'].includes(mod.exports.prerender))
		.some(Boolean)
}

// ------------------------------------------------------------------------------------------------

const updateSdkPluginVersion = async () => {
	const inlangConfigAsString = await readFile(cwd + "/inlang.config.js", { encoding: "utf-8" })

	const version = await getInstalledVersionOfPackage('@inlang/sdk-js')
	if (!version) return

	// this regex detects the new `https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin/dist/index.js` as well as
	// the older https://cdn.jsdelivr.net/npm/@inlang/sdk-js/dist/plugin/index.js url
	// both urls are also detected with the optional @version identifier
	const REGEX_PLUGIN_VERSION = /https:\/\/cdn\.jsdelivr\.net\/npm\/@inlang\/sdk-js(-plugin)?@?(.*)?\/dist(\/plugin)?\/index\.js/g

	const newConfig = inlangConfigAsString.replace(
		REGEX_PLUGIN_VERSION,
		`https://cdn.jsdelivr.net/npm/@inlang/sdk-js-plugin@${version}/dist/index.js`,
	)

	if (inlangConfigAsString !== newConfig) {
		console.info(`Updating 'inlang.config.js' to use the correct version of '@inlang/sdk-js-plugin' (${version})`)

		await writeFile(cwd + "/inlang.config.js", newConfig)
	}
}

const getInstalledVersionOfPackage = async (pkg: string) => {
	const { stderr, stdout } = await exec(`npm info ${pkg} version`)
		.catch((e) => ({ stderr: e, stdout: '' }))
	if (stderr) return undefined

	return stdout.trim()
}