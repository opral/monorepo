import type { NodeishFilesystemSubset } from "@inlang/plugin"
import * as Comlink from "comlink"
import { createImport } from "./import.js"
import { tryCatch } from "@inlang/result"
import type { InlangModule } from "@inlang/module"
import { endpoint } from "comlink-node/worker"

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

Comlink.expose(createLinter, endpoint)
