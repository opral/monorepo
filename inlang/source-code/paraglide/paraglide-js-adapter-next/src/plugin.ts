import type { NextConfig } from "next"
import { resolve } from "path"

/** The alias for the paraglide folder. */
const PARAGLIDE_ALIAS = "$paraglide-adapter-next-internal"

type ParaglideConfig = {
	project: string
	outdir: string
}

/**
 * Add this to your next.config.js to enable Paraglide.
 * It will register any aliases required by the Adapter,
 * aswell as register the build plugin if you're using webpack.
 *
 * @returns
 */
export function withParaglide(
	paraglideConfig: ParaglideConfig,
	nextConfig: NextConfig
): NextConfig {
	const webpack = !process.env.TURBOPACK
	if (webpack) {
		const originalWebpack = nextConfig.webpack
		const wrappedWebpack: NextConfig["webpack"] = (config, options) => {
			//register the alias in webpack
			const absoluteOutdir = resolve(config.context, paraglideConfig.outdir)

			config.resolve = config.resolve ?? {}
			config.resolve.alias = config.resolve.alias ?? {}
			config.resolve.alias[PARAGLIDE_ALIAS] = absoluteOutdir

			//apply any other webpack config if it exists
			if (typeof originalWebpack === "function") {
				return originalWebpack(config, options)
			}

			return config
		}

		nextConfig.webpack = wrappedWebpack
	}
	//turbo
	else {
		//register the alias in turbo
		nextConfig.experimental = nextConfig.experimental ?? {}
		nextConfig.experimental.turbo = nextConfig.experimental.turbo ?? {}
		nextConfig.experimental.turbo.resolveAlias = nextConfig.experimental.turbo.resolveAlias ?? {}
		nextConfig.experimental.turbo.resolveAlias[PARAGLIDE_ALIAS] = paraglideConfig.outdir
	}

	return nextConfig
}
