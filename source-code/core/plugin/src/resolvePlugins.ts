import type { ResolvedPlugins, ResolvePluginsFunction } from "./api.js"
import { PluginError } from "./errors.js"
import { parsePlugin } from "./parsePlugin.js"
import { validatePlugins } from "./validatePlugins.js"

export const resolvePlugins: ResolvePluginsFunction = (args) => {
	const result: Awaited<ReturnType<ResolvePluginsFunction>> = {
		data: {
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			appSpecificApi: {},
			meta: {} as any,
		},
		errors: [],
	}

	for (const plugin of args.plugins) {
		const pluginId = plugin.meta.id

		try {
			plugin.setup?.({
				options: args.pluginSettings?.[pluginId]?.options,
				fs: args.env.$fs,
			})

			/**
			 * -------------- PARSE & VALIDATE PLUGIN --------------
			 */

			// --- PARSE PLUGIN ---
			const parsed = parsePlugin({
				maybeValidPlugin: plugin,
			})

			if (parsed.error) {
				result.errors.push(...parsed.error)
				continue
			}

			// --- VALIDATE PLUGINS ---
			const validated = validatePlugins({
				plugins: result,
				plugin,
			})

			if (validated.errors) {
				result.errors.push(...validated.errors)
				continue
			}

			/**
			 * -------------- BEGIN ADDING TO RESULT --------------
			 */

			if (typeof plugin.loadMessages === "function") {
				result.data.loadMessages = async () =>
					await plugin.loadMessages!({ languageTags: args.config.languageTags })
			}

			if (typeof plugin.saveMessages === "function") {
				result.data.saveMessages = async (args: any) => await plugin.saveMessages!(args)
			}

			// result.data.plugins = {
			// 	...result.data.plugins,
			// 	[pluginId]: plugin,
			// }
		} catch (e) {
			/**
			 * -------------- BEGIN ERROR HANDLING --------------
			 */
			if (e instanceof PluginError) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(new PluginError(e.message, { plugin: pluginId, cause: e }))
			} else {
				result.errors.push(
					new PluginError("Unhandled and unknown error", {
						plugin: pluginId,
						cause: e,
					}),
				)
			}
			continue
		}

		return result as any
	}
}
