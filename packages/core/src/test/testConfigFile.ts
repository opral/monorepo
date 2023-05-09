import type { InlangEnvironment } from "../environment/types.js"
import { setupPlugins } from '../plugin/setupPlugins.js'
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
	const [, importKeywordUsedException] = importKeywordUsed(args.file)
	if (importKeywordUsedException) {
		return [undefined, importKeywordUsedException]
	}

	const { defineConfig } = await import("data:application/javascript;base64," + btoa(args.file))
	let config = await defineConfig(args.env)
	config &&= await setupPlugins({ config, env: args.env })
	const [, exception] = await testConfig({ config })
	if (exception) {
		return [undefined, exception]
	}

	return [true, undefined]
}

/**
 * Detects if the import keyword is used in the config file.
 */
function importKeywordUsed(configFile: string): Result<true, TestConfigException> {
	// This regex uses a negative lookbehind assertion (?<!...)
	// to match import keywords that are not immediately preceded
	// by a dollar sign. The \b ensures that the regex matches
	// only complete words.
	// $import, and JSDoc import statements are allowed
	const regex = /(?<!(\$)|\{|\{\s|\{\s\s)import\b/
	const hasError = regex.test(configFile)

	if (hasError) {
		return [
			undefined,
			new TestConfigException("Regular import statements are not allowed inside `inlang.config.js`. Use `$import` of the inlang environment instead. See https://inlang.com/documentation/inlang-environment.")
		]
	}

	return [true, undefined]
}
