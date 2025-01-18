import { findRepoRoot, openRepository } from "@lix-js/client"
import nodeishFs from "node:fs/promises"
import { Command } from "commander"
import { Logger } from "@inlang/paraglide-js/internal"
import { Steps, cli as ParaglideCli } from "@inlang/paraglide-js/internal/cli"
import { scanSvelteKitProject } from "../steps/scanSvelteKitProject.js"
import { addParaglideSvelteKitVitePlugin } from "../steps/addVitePlugin.js"
import { addI18nFile } from "../steps/addI18nFile.js"
import { addParaglideJSComponent } from "../steps/addParaglideJSComponent.js"
import { editAppHtmlFile } from "../steps/editAppHtmlFile.js"
import { addRerouteHook } from "../steps/addRerouteFile.js"
import { addHandleHook } from "../steps/addHandleHook.js"
import { PARAGLIDE_SVELTEKIT_VERSION, PARAGLIDE_SVELTEKIT_MARKETPLACE_ID } from "../../meta.js"
import { addTypesForLocals } from "../steps/updateAppTypes.js"

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

		const ctx0 = {
			repo,
			logger,
			repoRoot: repoRoot?.replace("file://", "") ?? process.cwd(),
			appId: PARAGLIDE_SVELTEKIT_MARKETPLACE_ID,
		}

		const ctx1 = await scanSvelteKitProject(ctx0)
		const ctx2 = await Steps.initializeInlangProject(ctx1)
		const ctx3 = await Steps.updatePackageJson({
			dependencies: async (deps) => ({
				...deps,
				"@inlang/paraglide-sveltekit": PARAGLIDE_SVELTEKIT_VERSION,
			}),
			devDependencies: async (deps) => ({
				...deps,
				"@inlang/paraglide-js": ParaglideCli.version() as string,
			}),
		})(ctx2)

		const ctx4 = await Steps.maybeChangeTsConfig(ctx3)
		const ctx5 = await addParaglideSvelteKitVitePlugin(ctx4)
		const ctx6 = await addI18nFile(ctx5)
		const ctx7 = await addParaglideJSComponent(ctx6)
		const ctx8 = await editAppHtmlFile(ctx7)
		const ctx9 = await addRerouteHook(ctx8)
		const ctx10 = await addHandleHook(ctx9)
		const ctx11 = await addTypesForLocals(ctx10)
		const crx12 = await Steps.maybeAddSherlock(ctx11)
		const crx13 = await Steps.maybeAddNinja(crx12)

		try {
			await Steps.runCompiler({ ...crx13, outdir: "./src/lib/paraglide" })
		} catch (e) {
			//silently ignore
		}

		logger.success(`Successfully initialized Paraglide-SvelteKit in this SvelteKit Project.

Learn more about Paraglide and Paraglide-Sveltekit at:
https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n
`)
	})
