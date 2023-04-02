import type { Config } from "../config/schema.js"
import { Config as ZodConfig } from "../config/zod.js"
import { Resource } from "../ast/zod.js"
import type * as ast from "../ast/schema.js"
import type { Result } from "../utilities/result.js"

/**
 * Validates the config.
 *
 * If you want to config the inlang.config.js file,
 * use the `validateConfigFile` function instead.
 *
 * @example
 * const [success, error] = await validateConfig(args)
 */
export async function validateConfig(args: { config: Config }): Promise<Result<true, Error>> {
	// each function throws an error if the validation fails.
	try {
		validateConfigSchema(args.config)
		referenceLanguageMustBeInLanguages(args.config)
		const resources = await args.config.readResources({ config: args.config })
		validateResources(resources)
		await languagesMatch(args.config, resources)
		await roundtripTest(args.config, resources)
		return [true, undefined]
	} catch (error) {
		return [undefined, error as Error]
	}
}

function validateConfigSchema(config: Config) {
	const result = ZodConfig.safeParse(config)
	if (!result.success) {
		throw new Error(result.error.issues.join("\n"))
	}
}

function referenceLanguageMustBeInLanguages(config: Config) {
	if (!config.languages.includes(config.referenceLanguage)) {
		throw new Error(
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

async function languagesMatch(config: Config, resources: ast.Resource[]) {
	const languages = resources.map((resource) => resource.languageTag.name)
	// sort the languages to ensure that the order does not matter
	// and convert the array to a string to compare the arrays
	const areEqual = languages.sort().join(",") === config.languages.sort().join(",")
	if (areEqual === false) {
		// TODO error message should contain the languages that are missing
		throw new Error(
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
async function roundtripTest(config: Config, resources: ast.Resource[]) {
	const commonErrorMessage =
		"A roundtrip test of the readResources and writeResources functions failed:\n"
	await config.writeResources({ config, resources })
	const readResources = await config.readResources({ config })
	// check if the number of resources is the same
	if (resources.length !== readResources.length) {
		throw new Error(commonErrorMessage + "The number of resources don't match.")
	}
	// check if the resources match
	for (const resource of resources) {
		// find the matching resource
		const matchingReadResource = readResources.find(
			(readResource) => readResource.languageTag.name === resource.languageTag.name,
		)
		// check if the resource exists
		if (matchingReadResource === undefined) {
			throw new Error(commonErrorMessage + `Missing the resource "${resource.languageTag.name}"`)
		}
		// check if the messages are identical
		for (const [messageIndex, message] of resource.body.entries()) {
			if (JSON.stringify(message) !== JSON.stringify(matchingReadResource.body[messageIndex]))
				throw new Error(
					commonErrorMessage +
						`The message with id "${message.id.name}" does not match for the resource with languageTag.name "${resource.languageTag.name}".`,
				)
		}
	}
}
