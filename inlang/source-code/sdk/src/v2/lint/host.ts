import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./worker.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { WorkerPrototype, adapter } from "comlink-node"
import type { ProjectSettings2 } from "../types/project-settings.js"

export async function createLintReportQuery(
	projectPath: string,
	lintRules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile">
) {
	const createLinter = Comlink.wrap<typeof createLinterType>(
		adapter(new WorkerPrototype(new URL("./worker.js", import.meta.url), { type: "module" }))
	)

	const fsProxy = Comlink.proxy(fs)
	const linter = await createLinter(projectPath, lintRules, fsProxy)
	await linter.lint({} as ProjectSettings2)
}
