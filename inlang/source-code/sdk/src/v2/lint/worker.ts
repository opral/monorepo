import type { NodeishFilesystemSubset } from "@inlang/plugin"
import * as Comlink from "comlink"
import { createImport } from "./import.js"
import { tryCatch } from "@inlang/result"
import type { InlangModule } from "@inlang/module"
//@ts-ignore
import { default as nodeAdapter } from "comlink/dist/esm/node-adapter.mjs"

export async function createLinter(
	projectPath: string,
	lintRules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile">
) {
	console.info(lintRules)
	const _import = createImport(projectPath, fs)

	for (const module of lintRules) {
		const importedModule = await tryCatch<InlangModule>(() => _import(module))
		console.info(importedModule)
	}

	return {}
}

const isNode = !("Worker" in globalThis)
const endpoint = isNode
	? nodeAdapter((await import(/* @vite-ignore */ "node:worker_threads"))["parentPort"])
	: undefined
Comlink.expose(createLinter, endpoint)
