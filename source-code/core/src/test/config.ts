import { Result } from "../utilities/index.js"
import type { Config, EnvironmentFunctions } from "../config/schema.js"
import { Config as ZodConfig } from "../config/zod.js"
import { Resource } from "../ast/zod.js"
import type * as ast from "../ast/schema.js"

/**
 * Validates the inlang.config.js file.
 *
 * @example
 * const result = await validateConfig(args)
 */
export async function validateConfig(args: {
	configFile: string
	env: EnvironmentFunctions
}): Promise<Result<void, Error>> {
	// each function throws an error if the validation fails.
	try {
		const { defineConfig } = await import(
			"data:application/javascript;base64," + btoa(args.configFile)
		)
		const config = defineConfig(args.env)
		// BEGIN rules
		importKeywordUsed(args.configFile)
		validateConfigSchema(config)
		referenceLanguageMustBeInLanguages(config)
		const resources = await validateResourceSchema(config)
		languagesMatch(config, resources)
		roundtripTest(config, resources)
		// END rules
		return Result.ok(undefined)
	} catch (error) {
		return Result.err(error as Error)
	}
}

/**
 * Detects if the import keyword is used in the config file.
 */
function importKeywordUsed(configFile: string) {
	// This regex uses a negative lookbehind assertion (?<!...)
	// to match import keywords that are not immediately preceded
	// by a dollar sign. The \b ensures that the regex matches
	// only complete words.
	const regex = /(?<!\$)import\b/
	if (regex.test(configFile)) {
		throw new Error(
			"Regular import statements are not allowed. Use the environment function $import instead.",
		)
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

async function validateResourceSchema(config: Config) {
	const resources = await config.readResources({ config })
	for (const resource of resources) {
		// parse throws an error if any resource is invalid
		Resource.parse(resource)
	}
	return resources
}

async function languagesMatch(config: Config, resources: ast.Resource[]) {
	const languages = resources.map((resource) => resource.language)
	if (new Set(config.languages) !== new Set(languages)) {
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
	const message = "A roundtrip test of the readResources and writeResources functions failed:\n"
	await config.writeResources({ config, resources })
	const readResources = await config.readResources({ config })
	if (resources.length !== readResources.length) {
		throw new Error(message + "The number of resources don't match.")
	}
	for (const [index, resource] of resources.entries()) {
		if (resource.body.length !== readResources[index].body.length) {
			throw new Error(
				message +
					`The body length of the resources with languageTag.name "${resource.languageTag.name}" don't match.`,
			)
		}
		for (const [messageIndex, message] of resource.body.entries()) {
			if (JSON.stringify(message) !== JSON.stringify(readResources[index].body[messageIndex]))
				throw new Error(
					message +
						`The message with id ${message.id.name} do not match for the resource with languageTag.name "${resource.languageTag.name}".`,
				)
		}
	}
	// compare the entire resources
	if (JSON.stringify(resources) !== JSON.stringify(readResources)) {
		throw new Error(message + "The resources did not match after serialization (JSON.stringify).")
	}
}
