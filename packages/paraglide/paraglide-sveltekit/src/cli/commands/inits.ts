import { findRepoRoot, openRepository } from "@lix-js/client"
import nodeishFs from "node:fs/promises"
import { Command } from "commander"
import { Logger } from "@inlang/paraglide-js/internal"
import { Steps, cli as ParaglideCli } from "@inlang/paraglide-js/internal/cli"
import path from "node:path"

export const initCommand = new Command()
	.name("init")
	.summary("Initializes Paraglide-SvelteKit in this SvelteKit Project")
	.action(async () => {
		const repoRoot = await findRepoRoot({ nodeishFs, path: process.cwd() })

		// We are risking that there is no git repo. As long as we only use FS features and no Git features
		// from the SDK we should be fine.
		// Basic operations like `loadProject` should always work without a repo since it's used in CI.
		const repo = await openRepository(repoRoot ?? "file://" + process.cwd(), {
			nodeishFs,
		})

		const logger = new Logger({ prefix: false, silent: false })

		const packageJsonPath = path.resolve(process.cwd(), "package.json")

		const ctx0 = {
			repo,
			logger,
			repoRoot: repoRoot?.replace("file://", "") ?? process.cwd(),
			packageJsonPath,
			appId: "library.inlang.paraglideSvelteKit",
		}
		const ctx1 = await Steps.initializeInlangProject(ctx0)
		const ctx2 = await Steps.updatePackageJson({
			dependencies: async (deps) => ({
				...deps,
				"@inlang/paraglide-next": "0.0.7",
			}),
			devDependencies: async (deps) => ({
				...deps,
				"@inlang/paraglide-js": ParaglideCli.version() as string,
			}),
		})(ctx1)

		const ctx3 = await Steps.maybeChangeTsConfig(ctx2)

		try {
			await Steps.runCompiler({ ...ctx3, outdir: "./src/lib/paraglide" })
		} catch (e) {
			//silently ignore
		}

		logger.success(`Successfully initialized Paraglide-SvelteKit in this SvelteKit Project.

Learn more about Paraglide and Paraglide-Sveltekit at:
https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n
`)
	})
