import { parseConfig, ParseConfigException } from "../config/parseConfig.js"

/**
 * @deprecated Use `ParseConfigException` from `@inlang/core/config` instead.
 */
export class TestConfigException extends Error {
	readonly #id = "TestConfigException"
}

/**
 * @deprecated Use `parseConfig` from `@inlang/core/config` instead.
 */
export const testConfig = (
	...args: Parameters<typeof parseConfig>
): ReturnType<typeof parseConfig> => {
	try {
		return parseConfig(...args)
	} catch (error) {
		if (error instanceof ParseConfigException) throw new TestConfigException(error.message)
		throw error
	}
}
