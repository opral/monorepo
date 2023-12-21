import type { NextConfig } from "next"
import { resolve } from "path"
import { addRewrites } from "./rewrites"
import { addAlias } from "./alias"

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
	addAlias(nextConfig, {
		[PARAGLIDE_ALIAS]: paraglideConfig.outdir,
	})

	const router = nextConfig.i18n ? "pages" : "app"
	if (router === "app") {
		addRewrites(nextConfig, () => [
			{
				source: "/:locale(en|de)/:path*",
				destination: "/:path*",
			},
		])
	}

	return nextConfig
}

