import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { withReadOnlyCache } from "../../resolve-modules/cache.js"
import * as Comlink from "comlink"

export class Linter {
	async init(lintRules: string[], fs: Pick<NodeishFilesystemSubset, "readFile" | "writeFile">) {
		console.info(lintRules)
		console.info("read", await fs.readFile("somewhere"))
	}

	async lint() {
		// read the messages from slotstorage
	}
}

Comlink.expose(new Linter())
