import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./linter.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { Fix, LintReport, LintResult } from "../types/lint.js"
import type { MessageBundle } from "../types/message-bundle.js"
import type { Repository } from "@lix-js/client"
import { exposeRepoOn } from "../rpc/repo/index.js"
import { WorkerPrototype as Worker, adapter } from "comlink-node"

export type LinterFactory = (opts: { projectPath: string; repo: Repository }) => Promise<{
	terminate: () => void
	lint: (settings: ProjectSettings2) => Promise<LintResult>
	fix: (report: LintReport, fix: Fix<LintReport>) => Promise<MessageBundle>
}>

/**
 * Starts a web worker that can be used to lint messages.
 */
export const createLintWorker: LinterFactory = async ({ projectPath, repo }) => {
	const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
	const linter = await connectToLinter(projectPath, repo, adapter(worker))
	return {
		lint: linter.lint,
		fix: linter.fix,
		terminate: () => worker.terminate(),
	}
}

export async function connectToLinter(projectPath: string, repo: Repository, ep: Comlink.Endpoint) {
	const { port1, port2 } = new MessageChannel()
	const createLinter = Comlink.wrap<typeof createLinterType>(ep)
	exposeRepoOn(repo, port1)
	const linter = await createLinter(projectPath, Comlink.transfer(port2, [port2]))

	return linter
}
