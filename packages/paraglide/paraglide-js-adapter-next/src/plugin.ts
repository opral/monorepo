import type { NextConfig } from "next"
import { resolve } from "path"
import { paraglide as paraglide_webpack } from "@inlang/paraglide-js-adapter-webpack"

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
	const isWorker = process.env.NEXT_PRIVATE_WORKER !== undefined
	if (webpack) {
		const wrappedWebpack: NextConfig["webpack"] = (config, options) => {
			//register the alias in webpack
			const absoluteOutdir = resolve(config.context, paraglideConfig.outdir)

			config.resolve = config.resolve ?? {}
			config.resolve.alias = config.resolve.alias ?? {}
			config.resolve.alias[PARAGLIDE_ALIAS] = absoluteOutdir

			//Register webpack plugin
			/*
			if (!isWorker) {
				config.plugins.push(
					paraglide_webpack({
						project: paraglideConfig.project,
						outdir: paraglideConfig.outdir,
					})
				)
			}
			*/

			/*
			//apply any other webpack config if it exists
			if (typeof nextConfig?.webpack === "function") {
				return nextConfig.webpack(config, options)
			}
            */

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
