import type { Plugin } from "./plugin.js"

/**
 * Throws an error if the options are invalid.
 *
 * Not using zod becaue it's not worth the bundle size (2kb vs 14kb).
 */
export function throwIfInvalidOptions(options: PluginOptions) {
	if (typeof options.pathPattern === "string") {
		if (options.pathPattern.includes("{language}") === false) {
			throw new Error(
				"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
			)
		} else if (options.pathPattern.endsWith(".json") === false) {
			throw new Error(
				"The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'.",
			)
		} else if (options.pathPattern.includes("*")) {
			throw new Error(
				"The pathPattern includes a '*' wildcard. This was depricated in version 3.0.0. Check https://github.com/inlang/inlang/tree/main/source-code/plugins/i18next/ for how to use PluginSettings",
			)
		}
	} else {
		for (const [prefix, path] of Object.entries(options.pathPattern)) {
			if (path === undefined || path.includes("{language}") === false) {
				throw new Error(
					"The pathPattern setting must be defined and include the {language} placeholder. An example would be './resources/{language}.json'.",
				)
			} else if (path.endsWith(".json") === false) {
				throw new Error(
					"The pathPattern setting must end with '.json'. An example would be './resources/{language}.json'.",
				)
			} else if (prefix.includes(".")) {
				throw new Error(
					"A prefix of pathPattern includes an '.'. Use a string without dot notations. An example would be 'common'.",
				)
			}
		}
	}
}

export type PluginOptions = {
	/**
	 * Defines the path pattern for the resources.
	 *
	 * Could be one path or multible namespaces
	 * Must include the `{language}` placeholder.
	 *
	 * @example
	 *  "./resources/{language}.json"
	 *
	 * @example
	 *  {
	 * 		"common": "./resources/{language}/common.json"
	 * 		"card": "./resources/{language}/card.json"
	 *  }
	 */
	pathPattern: string | Record<string, string>
	/**
	 * Defines the pattern for variable references.
	 *
	 * Can be either a single string ("Hello @user") or
	 * an array of two strings ("Hello {{user}}").
	 */
	variableReferencePattern?: [string] | [string, string]
	/**
	 * Ignores all files that match the given pattern.
	 */
	ignore?: string[]
}

export type PluginOptionsWithDefaults = WithRequired<
	PluginOptions,
	"variableReferencePattern" | "ignore"
>

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// const options = {
// 	"variableReferencePattern": ["{{", "}}"], // string[]
// 	"standardPathPattern": "./resources/{language}.json", // string
// 	"pathPattern": {
// 		"common": "./resources/{language}/common.json",
// 		"card": "./resources/{language}/card.json",
// 	}, // Record<string, string>
// } satisfies Plugin["setup"]