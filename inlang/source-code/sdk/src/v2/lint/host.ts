import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./linter.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { WorkerPrototype as Worker, adapter } from "comlink-node"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { Fix, LintReport, LintResult } from "../types/lint.js"
import type { MessageBundle } from "../types/message-bundle.js"
import { makeFsAvailableTo } from "../rpc-fs/index.js"

export type LinterFactory = (opts: {
	projectPath: string
	nodeishFs: NodeishFilesystemSubset
}) => Promise<{
	terminate: () => void
	lint: (settings: ProjectSettings2) => Promise<LintResult>
	fix: (report: LintReport, fix: Fix<LintReport>) => Promise<MessageBundle>
}>

/**
 * Starts a web worker that can be used to lint messages.
 */
export const createLintWorker: LinterFactory = async ({ projectPath, nodeishFs }) => {
	const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
	const linter = await connectToLinter(projectPath, nodeishFs, adapter(worker))
	return {
		lint: linter.lint,
		fix: linter.fix,
		terminate: () => worker.terminate(),
	}
}

export async function connectToLinter(
	projectPath: string,
	fs: NodeishFilesystemSubset,
	ep: Comlink.Endpoint
) {
	const { port1, port2 } = new MessageChannel()
	makeFsAvailableTo(fs, port1)

	const createLinter = Comlink.wrap<typeof createLinterType>(ep)
	const linter = await createLinter(projectPath, port2)

	return linter
}
