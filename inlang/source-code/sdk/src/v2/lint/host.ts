import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./worker.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { WorkerPrototype as Worker, adapter } from "comlink-node"
import type { ProjectSettings2 } from "../types/project-settings.js"

import _debug from "debug"
const debug = _debug("sdk-v2:lintReports")

/**
 * Starts a web worker that can be used to lint messages.
 */
export async function createLintWorker(
	projectPath: string,
	settings: ProjectSettings2,
	fs: Pick<NodeishFilesystemSubset, "readFile" | "readdir" | "mkdir">
) {
	const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
	const createLinter = Comlink.wrap<typeof createLinterType>(adapter(worker))

	debug("started lint-worker")

	const fsProxy = Comlink.proxy(fs)
	const linter = await createLinter(projectPath, settings, fsProxy)

	debug("created linter in lint-worker")

	return {
		lint: (settings: ProjectSettings2) => linter.lint(settings),
		fix: linter.fix,
		terminate: () => worker.terminate(),
	}
}
