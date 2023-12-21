import { NextConfig } from "next"
import { resolve } from "path"
import { paraglide } from "@inlang/paraglide-js-adapter-webpack"

/**
 * Adds an alias to the bundler config.
 * @param config The Next.js config object
 * @param aliases A map of aliases to their relative paths
 */
export function addAlias(nextConfig: NextConfig, aliases: Record<string, string>) {
	const bundler = process.env.TURBOPACK ? "turbo" : "webpack"

	if (bundler === "webpack") {
		const originalWebpack = nextConfig.webpack
		const wrappedWebpack: NextConfig["webpack"] = (config, options) => {
			const absoluteAliases: Record<string, string> = {}
			for (const [alias, relativePath] of Object.entries(aliases)) {
				absoluteAliases[alias] = resolve(config.context, relativePath)
			}

			config.resolve = config.resolve ?? {}
			config.resolve.alias = config.resolve.alias ?? {}

			console.log("paraglide", paraglide)

			config.resolve.alias = {
				...config.resolve.alias,
				...absoluteAliases,
			}

			//apply any other webpack config if it exists
			if (typeof originalWebpack === "function") {
				return originalWebpack(config, options)
			}

			return config
		}

		nextConfig.webpack = wrappedWebpack
	} else if (bundler === "turbo") {
		nextConfig.experimental = nextConfig.experimental ?? {}
		nextConfig.experimental.turbo = nextConfig.experimental.turbo ?? {}
		nextConfig.experimental.turbo.resolveAlias = nextConfig.experimental.turbo.resolveAlias ?? {}

		nextConfig.experimental.turbo.resolveAlias = {
			...nextConfig.experimental.turbo.resolveAlias,
			...aliases,
		}
	}
}
