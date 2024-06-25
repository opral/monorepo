import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./worker.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { WorkerPrototype, adapter } from "comlink-node"
import type { ProjectSettings2 } from "../types/project-settings.js"

import _debug from "debug"
const debug = _debug("sdk-v2:lintReports")

export async function createLintWorker(
	projectPath: string,
	modules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile">
) {
	const createLinter = Comlink.wrap<typeof createLinterType>(
		adapter(new WorkerPrototype(new URL("./worker.js", import.meta.url), { type: "module" }))
	)

	debug("started lint-worker")

	const fsProxy = Comlink.proxy(fs)
	const linter = await createLinter(projectPath, modules, fsProxy)

	debug("created linter in lint-worker")

	return {
		/**
		 * Causes the linter to read the message-bundles from disk & run the lint-rules
		 * @param settings
		 */
		lint: async (settings: ProjectSettings2) => {
			await linter.lint(settings)
		},
	}
}
