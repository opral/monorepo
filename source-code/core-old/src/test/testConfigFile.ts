import type { InlangConfigModule } from "../config/schema.js"
import { setupConfig } from "../config/setupConfig.js"
import type { InlangEnvironment } from "../environment/types.js"
import type { Result } from "../utilities/result.js"
import { parseConfig, ParseConfigException } from "../config/parseConfig.js"

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
}): Promise<Result<true, ParseConfigException>> {
	try {
		const [, importKeywordUsedException] = importKeywordUsed(args.file)
		if (importKeywordUsedException) {
			return [undefined, importKeywordUsedException]
		}
		const module: InlangConfigModule = await import(
			"data:application/javascript;base64," + btoa(args.file)
		)
		const config = await setupConfig({ module, env: args.env })
		const [, exception] = await parseConfig({ config })
		if (exception) {
			return [undefined, exception]
		}

		return [true, undefined]
	} catch (e) {
		return [undefined, new ParseConfigException((e as Error).message)]
	}
}

/**
 * Detects if the import keyword is used in the config file.
 */
function importKeywordUsed(configFile: string): Result<true, ParseConfigException> {
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
			new ParseConfigException(
				"Regular import statements are not allowed inside `inlang.config.js`. Use `$import` of the inlang environment instead. See https://inlang.com/documentation/inlang-environment.",
			),
		]
	}

	return [true, undefined]
}
