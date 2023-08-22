import type { JSXElement } from "solid-js"
import { open, createNodeishMemoryFs } from "@project-lisa/client"
import { createInlang } from "@inlang/app"
import type { InlangModule } from "@inlang/module"
import { getLocalStorage, useLocalStorage } from "#src/services/local-storage/index.js"

export function InstallationProvider(props: {
	repo: string
	modules: string[]
	children: JSXElement
}) {
	initializeRepo(props.repo, props.modules)

	return props.children
}

async function initializeRepo(repoURL: string, modulesURL: string[]) {
	const [localStorage] = useLocalStorage() ?? []

	const user = localStorage?.user

	const repo = open(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		auth: user,
	})

	// Get the content of the inlang.config.js file
	await repo.nodeishFs.readFile("./inlang.config.js", { encoding: "utf-8" }).catch((e) => {
		if (e.code !== "ENOENT") throw e
		throw new Error("No inlang.config.js file found in the repository.")
	})

	const inlang = await createInlang({
		configPath: "./inlang.config.json",
		nodeishFs: repo.nodeishFs,
		// _import: async () =>
		// 	({
		// 		default: {
		// 			// @ts-ignore
		// 			plugins: [...pluginJson.plugins],
		// 			// @ts-ignore
		// 			lintRules: [...pluginLint.lintRules],
		// 		},
		// 	} satisfies InlangModule),
	})

	console.log("inlang", inlang)
}
