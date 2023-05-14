import type { InlangConfig } from "../config/schema.js"
import type { InlangEnvironment } from "../environment/types.js"

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
// The function should be SYNC!
//
// If we allow the setup function to be async,
// developers will import all module at top level
// scope which will lead to long loading times when
// setting up plugins / initial load of the editor
// because the module are not imported "on-demand".
//
// See https://github.com/inlang/inlang/commit/ec15170bc17ef36916123152d2fdbc3b2e8c0d91#r111216268
export type PluginSetupFunction = (env: InlangEnvironment) => Plugin

/**
 * An inlang plugin.
 */
export type Plugin = {
	id: `${string}.${string}`
	config(
		config: Readonly<Partial<InlangConfig>>,
	): MaybePromise<Partial<InlangConfig> & Record<string, unknown>>
}

type MaybePromise<T> = Promise<T> | T
