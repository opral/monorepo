import type * as ast from "@inlang/core/ast"
import { expect, it } from "vitest"
import { parseConfig } from "./parseConfig.js"
import type { InlangEnvironment } from "../environment/types.js"
import type { InlangConfig } from "../config/index.js"
import { mockEnvironment } from "../test/mockEnvironment.js"
import type { LanguageTag } from "../languageTag/index.js"

it("should succeed if the config is valid", async () => {
	const env = await mockEnvironment({})
	// mock files
	await env.$fs.writeFile(
		"./en.json",
		JSON.stringify({ hello: "Hello from the English resource." }),
	)
	await env.$fs.writeFile(
		"./de.json",
		JSON.stringify({ hello: "Hallo von der Deutschen Resource." }),
	)
	const [, exception] = await parseConfig({ config: await mockDefineConfig(env) })
	expect(exception).toBeUndefined()
})

it("should fail if the config is invalid", async () => {
	const [, exception] = await parseConfig({
		config: {
			// @ts-expect-error
			sourceLanguageTag: 5,
		},
	})
	expect(exception).toBeDefined()
})

it("should fail if the sourceLanguageTag is not included in languagesTags", async () => {
	const env = await mockEnvironment({})
	const config = await mockDefineConfig(env)
	config.languageTags = ["de"]
	const [, exception] = await parseConfig({
		config,
	})
	expect(exception).toBeDefined()
})

// can be removed eventually
it("should apply referenceLanguage and languages to sourceLanguageTag and languageTags to avoid a breaking change", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile(
		"./en.json",
		JSON.stringify({ hello: "Hello from the English resource." }),
	)
	await env.$fs.writeFile(
		"./de.json",
		JSON.stringify({ hello: "Hallo von der Deutschen Resource." }),
	)
	const config = await mockDefineConfig(env)
	// 	@ts-expect-error - testing a breaking change
	config.languages = config.languageTags
	// @ts-expect-error - testing a breaking change
	config.referenceLanguage = config.sourceLanguageTag
	// @ts-expect-error - testing a breaking change
	delete config.languageTags
	// @ts-expect-error - testing a breaking change
	delete config.sourceLanguageTag
	const [, exception] = await parseConfig({
		config,
	})
	expect(exception).toBeUndefined()
	expect(config.sourceLanguageTag).toBe("en")
	expect(config.languageTags).toEqual(["en", "de"])
})

// TODO prints an error to the console which is annoying when running tests
//      otherwise, works.
// it("should fail if the resources languages don't match the config languages", async () => {
// 	const env = await mockEnvironment({})
// 	const config = await mockDefineConfig(env)
// 	config.languages = ["de", "en", "fr"]
// 	const [, exception] = await validateConfig({
// 		config,
// 	})
// 	if (exception) {
// 		console.error(exception)
// 	}
// 	expect(exception).toBeDefined()
// })

/**
 * --------------------------------------------------------------------
 * MOCK CONFIG
 * --------------------------------------------------------------------
 */

// exported for another test
export async function mockDefineConfig(env: InlangEnvironment): Promise<InlangConfig> {
	const pluginConfig = {
		pathPattern: "./{language}.json",
	} satisfies PluginConfig

	return {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		loadMessages: (args) => loadMessages({ ...args, ...env, pluginConfig }),
		saveMessages: (args) => saveMessages({ ...args, ...env, pluginConfig }),
	}
}

/**
 * The plugin configuration.
 */
type PluginConfig = {
	/**
	 * Defines the path pattern for the resources.
	 *
	 * Must include the `{language}` placeholder.
	 *
	 * @example
	 *  "./resources/{language}.json"
	 */
	pathPattern: string
}

/**
 * Reading resources.
 *
 * The function merges the args from Config['readResources'] with the pluginConfig
 * and EnvironmentFunctions.
 */
async function loadMessages(
	// merging the first argument from config (which contains all arguments)
	// with the custom pluginConfig argument
	args: Parameters<InlangConfig["loadMessages"]>[0] &
		InlangEnvironment & { pluginConfig: PluginConfig },
): ReturnType<InlangConfig["loadMessages"]> {
	const result: ast.Message[] = []
	for (const languageTag of args.config.languageTags) {
		const resourcePath = args.pluginConfig.pathPattern.replace("{language}", languageTag)
		const json = JSON.parse(
			(await args.$fs.readFile(resourcePath, { encoding: "utf-8" })) as string,
		)
		const messages = Object.entries(json).map(([id, value]) => ({
			id: id,
			pattern: parsePattern(value as string),
			languageTag,
		}))
		result.push(...messages)
	}
	return result
}

/**
 * Writing resources.
 *
 * The function merges the args from Config['readResources'] with the pluginConfig
 * and InlangEnvironment.
 */
async function saveMessages(
	args: Parameters<InlangConfig["saveMessages"]>[0] &
		InlangEnvironment & { pluginConfig: PluginConfig },
): ReturnType<InlangConfig["saveMessages"]> {
	const resources: Record<LanguageTag, Record<ast.Message["id"], string>> = {}
	for (const message of args.messages) {
		if (resources[message.languageTag] === undefined) {
			resources[message.languageTag] = {}
		}
		resources[message.languageTag]![message.id] = serializePattern(message.pattern)
	}
	for (const [languageTag, resource] of Object.entries(resources)) {
		const resourcePath = args.pluginConfig.pathPattern.replace("{language}", languageTag)
		await args.$fs.writeFile(resourcePath, JSON.stringify(resource))
	}
}

function parsePattern(value: string): ast.Message["pattern"] {
	return [{ type: "Text", value }]
}

function serializePattern(pattern: ast.Message["pattern"]): string {
	return pattern.map((element) => (element as ast.Text).value).join("")
}
