import type { NextConfig } from "next"
import fs from "fs/promises"
import { addRewrites } from "./rewrites"
import { addAlias } from "./alias"
import { resolve } from "path"

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
		"$paraglide-adapter-next-internal/runtime.js": paraglideConfig.outdir + "/runtime.js",
	})

	const router = nextConfig.i18n ? "pages" : "app"
	if (router === "app") {
		addRewrites(nextConfig, async () => {
			const { loadProject } = await import("@inlang/sdk")
			const projectPath = resolve(process.cwd(), paraglideConfig.project)
			const project = await loadProject({
				projectPath,
				nodeishFs: fs,
			})
			const { languageTags } = project.settings()

			return [
				{
					source: `/:locale(${languageTags.join("|")})/:path*`,
					destination: "/:path*?locale=:locale",
				},
			]
		})
	}

	return nextConfig
}
