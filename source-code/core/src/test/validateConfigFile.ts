import type { EnvironmentFunctions } from "../config/schema.js"
import type { Result } from "../utilities/result.js"
import { validateConfig } from "./validateConfig.js"

/**
 * Validates the inlang.config.js file.
 *
 * If you only want to validate the config object,
 * use the `validateConfig` function instead.
 *
 * @example
 * const [success, error] = await validateConfigFile(args)
 */
export async function validateConfigFile(args: {
	file: string
	env: EnvironmentFunctions
}): Promise<Result<true, Error>> {
	try {
		// BEGIN
		// throws if an error occurs
		importKeywordUsed(args.file)
		// END
		const { defineConfig } = await import("data:application/javascript;base64," + btoa(args.file))
		const config = await defineConfig(args.env)
		const [, exception] = await validateConfig({ config })
		if (exception) {
			throw exception
		}
		return [true, undefined]
	} catch (error) {
		return [undefined, error as Error]
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
	const hasError = regex.test(configFile)
	if (hasError) {
		throw new Error(
			"Regular import statements are not allowed. Use the environment function $import instead.",
		)
	}
}
