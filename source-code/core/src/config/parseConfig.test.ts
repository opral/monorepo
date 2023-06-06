import type * as ast from "@inlang/core/ast"
import { expect, it } from "vitest"
import { parseConfig } from "./parseConfig.js"
import type { Language } from "@inlang/core/ast"
import type { InlangEnvironment } from "../environment/types.js"
import type { InlangConfig } from "../config/index.js"
import { mockEnvironment } from "../test/mockEnvironment.js"
import { createResource } from '../test/utils.js'

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
			referenceLanguage: 5,
		},
	})
	expect(exception).toBeDefined()
})

it("should fail if the referenceLanguage is not included in languages", async () => {
	const env = await mockEnvironment({})
	const config = await mockDefineConfig(env)
	config.languages = ["de"]
	const [, exception] = await parseConfig({
		config,
	})
	expect(exception).toBeDefined()
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
		referenceLanguage: "en",
		languages: ["en", "de"],
		readResources: (args) => readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) => writeResources({ ...args, ...env, pluginConfig }),
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
async function readResources(
	// merging the first argument from config (which contains all arguments)
	// with the custom pluginConfig argument
	args: Parameters<InlangConfig["readResources"]>[0] &
		InlangEnvironment & { pluginConfig: PluginConfig },
): ReturnType<InlangConfig["readResources"]> {
	const result: ast.Resource[] = []
	for (const language of args.config.languages) {
		const resourcePath = args.pluginConfig.pathPattern.replace("{language}", language)
		// reading the json, and flattening it to avoid nested keys.
		const json = JSON.parse(
			(await args.$fs.readFile(resourcePath, { encoding: "utf-8" })) as string,
		)
		result.push(parseResource(json, language))
	}
	return result
}

/**
 * Writing resources.
 *
 * The function merges the args from Config['readResources'] with the pluginConfig
 * and InlangEnvironment.
 */
async function writeResources(
	args: Parameters<InlangConfig["writeResources"]>[0] &
		InlangEnvironment & { pluginConfig: PluginConfig },
): ReturnType<InlangConfig["writeResources"]> {
	for (const resource of args.resources) {
		const resourcePath = args.pluginConfig.pathPattern.replace(
			"{language}",
			resource.languageTag.name,
		)
		await args.$fs.writeFile(resourcePath, serializeResource(resource))
	}
}

/**
 * Parses a resource.
 *
 * @example
 *  parseResource({ "test": "Hello world" }, "en")
 */
function parseResource(
	/** flat JSON refers to the flatten function from https://www.npmjs.com/package/flat */
	flatJson: Record<string, string>,
	language: Language,
): ast.Resource {
	return createResource(language, ...Object.entries(flatJson).map(([id, value]) => parseMessage(id, value)))
}

/**
 * Parses a message.
 *
 * @example
 *  parseMessage("test", "Hello world")
 */
function parseMessage(id: string, value: string): ast.Message {
	return {
		type: "Message",
		id: {
			type: "Identifier",
			name: id,
		},
		pattern: { type: "Pattern", elements: [{ type: "Text", value: value }] },
	}
}

/**
 * Serializes a resource.
 *
 * The function unflattens, and therefore reverses the flattening
 * in parseResource, of a given object. The result is a stringified JSON
 * that is beautified by adding (null, 2) to the arguments.
 *
 * @example
 *  serializeResource(resource)
 */
function serializeResource(resource: ast.Resource): string {
	const json = Object.fromEntries(resource.body.map(serializeMessage))
	return JSON.stringify(json, undefined, 2)
}

/**
 * Serializes a message.
 *
 * Note that only the first element of the pattern is used as inlang, as of v0.3,
 * does not support more than 1 element in a pattern.
 */
function serializeMessage(message: ast.Message): [id: string, value: string] {
	return [message.id.name, (message.pattern.elements[0] as ast.Text).value]
}
