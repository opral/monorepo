import { ConfigPathNotFoundError, createInlang, tryCatch, type InlangInstance } from '@inlang/app'
import { InlangSdkException } from './exceptions.js'
import type { NodeishFilesystem } from '@inlang-git/fs'
import { writeFile } from 'node:fs/promises'
import { dedent } from 'ts-dedent'
import path from "node:path"

let appPromise: Promise<unknown> | undefined = undefined

const PATH_TO_CWD = process.cwd()
const PATH_TO_INLANG_CONFIG_FILE = path.resolve(PATH_TO_CWD, "./inlang.config.json")

export const initInlangApp = async (): Promise<unknown> => {
	if (appPromise) return appPromise

	// eslint-disable-next-line no-async-promise-executor
	return (appPromise = new Promise<unknown>(async (resolve) => {
		const { data: appInstance, error: createInlangError } = await tryCatch(async () =>
			createInlang({ nodeishFs: await getFs(), configPath: './inlang.config.json' })
		)

		if (createInlangError) {
			if (createInlangError instanceof ConfigPathNotFoundError) {
				await createBasicInlangConfig()
				appPromise = undefined
				return resolve(initInlangApp())
			}

			throw createInlangError
		}

		assertSdkWasSetUp(appInstance.appSpecificApi)

		// await createDemoResourcesIfNoMessagesExistYet()

		resolve(appInstance)
	}))
}

const getFs = () => import("node:fs/promises").catch(() =>
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
const createBasicInlangConfig = async () => writeFile(
	PATH_TO_INLANG_CONFIG_FILE,
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
					"inlang.plugin-json": {
						"options": {
							"pathPattern": "./languages/{{languageTag}}.json"
						}
					}
				}
			}
		}
	`)

class InlangSdkConfigException extends InlangSdkException { }

// TODO: automatically add modules if missing ???
function assertSdkWasSetUp(
	appSpecificApi: InlangInstance["appSpecificApi"],
) {
	let appSpecificApiValue: any
	appSpecificApi.subscribe(value => appSpecificApiValue = value)

	if (!("inlang.sdk-js" in appSpecificApiValue)) {
		throw new InlangSdkConfigException(dedent`
				Invalid config. Make sure to add the 'inlang.plugin-sdk-js' to your 'inlang.config.json' file.
				See https://inlang.com/documentation/sdk/configuration
			`)
	}
}
