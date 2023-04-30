import type { Config, EnvironmentFunctions } from "../config/schema.js"

/**
 * The function to configure a plugin.
 *
 * @example
 * 	plugins: [
 * 		myPlugin({
 *			pathPattern: "./languages/*.json",
 *		})
 *	]
 */
export type PluginSetupFunction = (env: EnvironmentFunctions) => Plugin

/**
 * An inlang plugin.
 */
export type Plugin = {
	id: `${string}.${string}`
	config(): MaybePromise<Partial<Config>>
}

type MaybePromise<T> = Promise<T> | T
