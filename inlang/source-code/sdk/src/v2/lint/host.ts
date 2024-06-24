import * as Comlink from "comlink"
//@ts-ignore
import { default as nodeEndpoint } from "comlink/dist/esm/node-adapter.mjs"
import type { createLinter as createLinterType } from "./worker.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

const isNode = !("Worker" in globalThis)

export async function createLintReportQuery(
	projectPath: string,
	lintRules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile">
) {
	const _Worker = isNode
		? (await import(/* @vite-ignore */ "node:worker_threads"))["Worker"]
		: Worker
	const adapter = isNode ? nodeEndpoint : <T>(x: T) => x

	const createLinter = Comlink.wrap<typeof createLinterType>(
		adapter(new _Worker(new URL("./worker.js", import.meta.url), { type: "module" }))
	)

	const fsProxy = Comlink.proxy(fs)
	const linter = await createLinter(projectPath, lintRules, fsProxy)
}

await createLintReportQuery(
	"/somewhere",
	["https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js"],
	{
		// @ts-ignore
		readFile: async () => {
			throw new Error()
		},
	}
)
