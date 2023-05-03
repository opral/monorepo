import type { InlangEnvironment } from "../environment/types.js"
import type { Result } from "../utilities/result.js"
import { testConfig, TestConfigException } from "./testConfig.js"

/**
 * Validates the inlang.config.js file.
 *
 * If you only want to validate the config object,
 * use the `testConfig` function instead.
 *
 * @example
 * const [success, error] = await testConfigFile(args)
 */
export async function testConfigFile(args: {
	file: string
	env: InlangEnvironment
}): Promise<Result<true, TestConfigException>> {
	try {
		// BEGIN
		// throws if an error occurs
		importKeywordUsed(args.file)
		// END
		const { defineConfig } = await import("data:application/javascript;base64," + btoa(args.file))
		const config = await defineConfig(args.env)
		const [, exception] = await testConfig({ config })
		if (exception) {
			throw exception
		}
		return [true, undefined]
	} catch (error) {
		return [undefined, error as TestConfigException]
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
		throw new TestConfigException(
			"Regular import statements are not allowed. Use $import of the inlang environment instead.",
		)
	}
}
