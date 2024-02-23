import type { NextConfig } from "next"
import { addAlias } from "./alias"
import { once } from "./utils"
import { useCompiler } from "./useCompiler"

type ParaglideConfig = {
	project: string
	outdir: string
}

type Config = NextConfig & {
	paraglide: ParaglideConfig
	paths?: Record<string, Record<string, string>>
}

/**
 * Add this to your next.config.js to enable Paraglide.
 * It will register any aliases required by the Adapter,
 * aswell as register the build plugin if you're using webpack.
 *
 * @returns
 */
export function paraglide(config: Config): NextConfig {
	addAlias(config, {
		"$paraglide/runtime.js": config.paraglide.outdir + "/runtime.js",
	})

	// Next calls `next.config.js` TWICE. Once in a worker and once in the main process.
	// We only want to compile the Paraglide project once, so we only do it in the main process.
	once(() => {
		useCompiler({
			project: config.paraglide.project,
			outdir: config.paraglide.outdir,
			watch: process.env.NODE_ENV === "development",
		})
	})

	const nextConfig: NextConfig = { ...config }
	delete nextConfig.paraglide

	return nextConfig
}
