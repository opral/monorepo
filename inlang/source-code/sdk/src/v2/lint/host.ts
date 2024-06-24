import * as Comlink from "comlink"
import type { createLinter as createLinterType } from "./worker.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { WorkerPrototype, adapter } from "comlink-node"

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
}

await createLintReportQuery(
	"/somewhere",
	["https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js"],
	{
		// @ts-ignore
		readFile: async (path) => {
			console.log("reading", path)
			throw new Error()
		},
	}
)
