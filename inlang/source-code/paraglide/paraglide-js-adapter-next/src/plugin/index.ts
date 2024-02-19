import type { NextConfig } from "next"
import { addRewrites } from "./rewrites"
import { addAlias } from "./alias"
import { resolve } from "path"
import fs from "fs/promises"

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

	const router = config.i18n ? "pages" : "app"
	if (router === "app") {
		addRewrites(config, async () => {
			const { loadProject } = await import("@inlang/sdk")
			const { openRepository, findRepoRoot } = await import("@lix-js/client")
			const projectPath = resolve(process.cwd(), config.paraglide.project)
			const repoRoot = await findRepoRoot({
				nodeishFs: fs,
				path: projectPath,
			})

			const repo = await openRepository(repoRoot || process.cwd(), {
				nodeishFs: fs,
			})

			const project = await loadProject({
				projectPath,
				repo,
			})

			const { languageTags } = project.settings()

			return [
				{
					source: `/:locale(${languageTags.join("|")})/:path*`,
					destination: "/:path*",
				},
			]
		})
	}

	const nextConfig: NextConfig = { ...config }
	delete nextConfig.paraglide

	return nextConfig
}
