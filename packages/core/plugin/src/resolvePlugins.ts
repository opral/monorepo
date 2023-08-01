import type { ResolvedPluginsApi, ResolvePlugins } from "./api.js"
import { PluginError } from "./errors.js"
import { parsePlugin } from "./parsePlugin.js"
import { validatePlugins } from "./validatePlugins.js"

export type ResolvePluginsResult = {
    data: Partial<ResolvedPluginsApi> & Pick<ResolvedPluginsApi, "plugins" | "appSpecificApi">
    errors: PluginError[]
}

export const resolvePlugins: ResolvePlugins = (args) => {
    const result: ResolvePluginsResult = {
        data: {
            plugins: {},
            appSpecificApi: {},
        },
        errors: [],
    }

    for (const plugin of args.plugins) {
        const pluginId = plugin.meta.id

        try {
            const setup = plugin.setup?.({
                options: args.pluginsInConfig[pluginId]?.options ?? {},
                config: args.config,
            })
            const appSpecificApi = plugin.addAppSpecificApi?.() ?? {}
        
            /**
             * -------------- PARSE & VALIDATE PLUGIN --------------
             */
        
            // --- PARSE PLUGIN ---
            const parsed = parsePlugin({
                maybeValidPlugin: plugin,
            })
        
            if (parsed.errors) {
                result.errors.push(...parsed.errors)
            }
        
            // --- VALIDATE PLUGINS ---
            const validated = validatePlugins({
                plugins: result,
                plugin,
                pluginInConfig: args.pluginsInConfig[pluginId],
            })

            if (validated.errors) {
                result.errors.push(...validated.errors)
            }
        
            if (validated.errors) {
                result.errors.push(...validated.errors)
            }
        
            /**
             * -------------- BEGIN ADDING TO RESULT --------------
             */
        
            if (typeof plugin.loadMessages === "function") {
                result.data.loadMessages = async () => await plugin.loadMessages!(args)
            }
        
            if (typeof plugin.saveMessages === "function") {
                result.data.saveMessages = async (args: any) => await plugin.saveMessages!(args)
            }
        
            result.data.appSpecificApi = {
                ...result.data.appSpecificApi,
                ...appSpecificApi,
            }
        
            result.data.plugins = {
                ...result.data.plugins,
                [pluginId]: plugin,
            }
        } catch (e) {
            			/**
			 * -------------- BEGIN ERROR HANDLING --------------
			 */
			if (e instanceof PluginError) {
				result.errors.push(e)
			} else if (e instanceof Error) {
				result.errors.push(
					new PluginError(e.message, { plugin: pluginId, cause: e }),
				)
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
