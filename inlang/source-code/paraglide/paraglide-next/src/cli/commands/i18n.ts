import { Command } from "commander"
import { SetUpI18nRoutingFlow } from "../flows/set-up-i18n-routing"
import { findRepoRoot, openRepository } from "@lix-js/client"
import nodeFsPromises from "node:fs/promises"
import path from "node:path"
import { Logger } from "@inlang/paraglide-js/internal"

export const i18nCommand = new Command().name("i18n").action(async () => {
	const repoRoot = await findRepoRoot({ nodeishFs: nodeFsPromises, path: process.cwd() })

	// We are risking that there is no git repo. As long as we only use FS features and no Git features
	// from the SDK we should be fine.
	// Basic operations like `loadProject` should always work without a repo since it's used in CI.
	const repo = await openRepository(repoRoot ?? "file://" + process.cwd(), {
		nodeishFs: nodeFsPromises,
	})

	const logger = new Logger({ prefix: false, silent: false })

	await SetUpI18nRoutingFlow({
		repo,
		repoRoot: repoRoot?.replace("file://", "") ?? process.cwd(),
		logger,
		srcRoot: path.resolve(process.cwd(), "src"),
	})
})
