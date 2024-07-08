import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./linter.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { WorkerPrototype as Worker, adapter } from "comlink-node"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { Fix, LintReport, LintResult } from "../types/lint.js"
import type { MessageBundle } from "../types/message-bundle.js"

export type LinterFactory = (opts: {
	projectPath: string
	settings: ProjectSettings2
	nodeishFs: Pick<NodeishFilesystemSubset, "readFile" | "readdir" | "mkdir">
}) => Promise<{
	terminate: () => void
	lint: (settings: ProjectSettings2) => Promise<LintResult>
	fix: (report: LintReport, fix: Fix<LintReport>) => Promise<MessageBundle>
}>

/**
 * Starts a web worker that can be used to lint messages.
 */
export const createLintWorker: LinterFactory = async ({ projectPath, settings, nodeishFs }) => {
	const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
	const linter = await connectToLinter(projectPath, settings, nodeishFs, adapter(worker))
	return {
		lint: linter.lint,
		fix: linter.fix,
		terminate: () => worker.terminate(),
	}
}

export async function connectToLinter(
	projectPath: string,
	settings: ProjectSettings2,
	fs: Pick<NodeishFilesystemSubset, "readFile" | "readdir" | "mkdir">,
	ep: Comlink.Endpoint
) {
	const createLinter = Comlink.wrap<typeof createLinterType>(ep)
	const fsProxy = Comlink.proxy(fs)
	const linter = await createLinter(projectPath, settings, fsProxy)
	return linter
}
