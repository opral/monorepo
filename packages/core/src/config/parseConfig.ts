import type { InlangConfig } from "./schema.js"
import { Resource } from "../ast/zod.js"
import type * as ast from "../ast/schema.js"
import type { Result } from "../utilities/result.js"
import { dedent } from "ts-dedent"
import { zConfig } from "./zod.js"

export class ParseConfigException extends Error {
	readonly #id = "ParseConfigException"
}

/**
 * Validates the config.
 *
 * If you want to test the config of the inlang.config.js file,
 * use the `testConfigFile` function instead.
 *
 * @example
 * const [success, error] = await testConfig(args)
 */
export async function parseConfig(args: {
	config: InlangConfig
}): Promise<Result<InlangConfig, ParseConfigException>> {
	// each function throws an error if the validation fails.
	try {
		// validate the config -> throws if invalid
		hasSetupAResourcePlugin(args.config)
		const parsedConfig = zConfig.passthrough().parse(args.config)
		referenceLanguageMustBeInLanguages(args.config)
		const resources = await args.config.readResources({ config: args.config })
		validateResources(resources)
		await languagesMatch(args.config, resources)
		await roundtripTest(args.config, resources)
		return [parsedConfig as InlangConfig, undefined]
	} catch (error) {
		return [undefined, error as ParseConfigException]
	}
}

function hasSetupAResourcePlugin(config: InlangConfig) {
	if (!config.readResources || !config.writeResources) {
		throw new ParseConfigException(
			`It seems you didn't set up a plugin to handle Resource files. See https://inlang.com/documentation/plugins/registry.`,
		)
	}
}

function referenceLanguageMustBeInLanguages(config: InlangConfig) {
	if (!config.languages.includes(config.referenceLanguage)) {
		throw new ParseConfigException(
			`The reference language "${config.referenceLanguage}" must be included in the list of languages.`,
		)
	}
}

function validateResources(resources: ast.Resource[]) {
	for (const resource of resources) {
		// parse throws an error if any resource is invalid
		Resource.parse(resource)
	}
}

async function languagesMatch(config: InlangConfig, resources: ast.Resource[]) {
	const languages = resources.map((resource) => resource.languageTag.name)
	// sort the languages to ensure that the order does not matter
	// and convert the array to a string to compare the arrays
	const areEqual = languages.sort().join(",") === config.languages.sort().join(",")
	if (areEqual === false) {
		// TODO error message should contain the languages that are missing
		throw new ParseConfigException(
			`The list of languages in the config file does not match the returned resources from \`readResources()\`.`,
		)
	}
}

/**
 * Testing a roundtrip of reading and writing resources.
 *
 * readResources -> AST (1) -> writeResources -> readResources -> AST (2).
 * AST (1) and AST (2) must be equal if the AST is not modified.
 *
 * Otherwise, the defined readResources and writeResources functions are not
 * implemented correctly e.g. by missing messages in the roundtrip.
 */
async function roundtripTest(config: InlangConfig, initialResources: ast.Resource[]) {
	const commonErrorMessage =
		"A roundtrip test of the readResources and writeResources functions failed:\n"
	await config.writeResources({ config, resources: initialResources })
	const readResourcesAgain = await config.readResources({ config })
	// check if the number of resources is the same
	if (initialResources.length !== readResourcesAgain.length) {
		throw new ParseConfigException(commonErrorMessage + "The number of resources don't match.")
	}
	// check if the resources match
	for (const intialResource of initialResources) {
		// find the matching resource
		const matchingReadResourceAgain = readResourcesAgain.find(
			(readResourceAgain) => readResourceAgain.languageTag.name === intialResource.languageTag.name,
		)
		// check if the resource exists
		if (matchingReadResourceAgain === undefined) {
			throw new ParseConfigException(
				commonErrorMessage + `Missing the resource "${intialResource.languageTag.name}"`,
			)
		}
		// check if the messages are identical
		for (const [messageIndex, initialMessage] of intialResource.body.entries()) {
			if (
				JSON.stringify(initialMessage) !==
				JSON.stringify(matchingReadResourceAgain.body[messageIndex])
			)
				throw new ParseConfigException(
					dedent(`
${commonErrorMessage}
The message with id "${initialMessage.id.name}" does not match for the resource
with languageTag.name "${intialResource.languageTag.name}".

Received:
${JSON.stringify(matchingReadResourceAgain.body[messageIndex], undefined, 2)}

Expected:
${JSON.stringify(initialMessage, undefined, 2)}
`),
				)
		}
	}
}
