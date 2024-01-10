import type { NextConfig } from "next"
import fs from "fs/promises"
import { addRewrites } from "./rewrites"
import { addAlias } from "./alias"
import { resolve } from "path"

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
export function withParaglide(config: Config): NextConfig {
	addAlias(config, {
		"$paraglide-adapter-next-internal/runtime.js": config.paraglide.outdir + "/runtime.js",
	})

	const router = config.i18n ? "pages" : "app"
	if (router === "app") {
		addRewrites(config, async () => {
			const { loadProject } = await import("@inlang/sdk")
			const projectPath = resolve(process.cwd(), config.paraglide.project)
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

	const nextConfig: NextConfig = { ...config }
	delete nextConfig.paraglide

	return nextConfig
}
