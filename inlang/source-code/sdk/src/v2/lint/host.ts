import * as Comlink from "comlink"
import type { Linter } from "./worker.js"
import type { NodeishFilesystemSubset } from "@inlang/plugin"

export async function createLintReportQuery(
	lintRules: string[],
	fs: Pick<NodeishFilesystemSubset, "readFile" | "writeFile">
) {
	const linter = Comlink.wrap<Linter>(new Worker("./worker.js", { type: "module" }))

	const fsProxy = Comlink.proxy(fs)
	await linter.init(lintRules, fsProxy)
}

await createLintReportQuery(["some-lint-rule", "another-lint-rule"], {
	readFile: async () => "some content",
})
