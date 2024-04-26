import { loadProject } from "@inlang/sdk"
import { openRepository } from "@lix-js/client"
import nodeishFs from "node:fs/promises"
import path from "node:path"

const projectPath = path.join(process.cwd(), "project.inlang")

const repo = await openRepository("file://" + process.cwd(), {
	nodeishFs,
})

const project = await loadProject({
	projectPath,
	repo,
})
const errors = project.errors()

if (errors) {
	console.error(errors)
	process.exit(1)
}

await sleep(500)
const messages = project.query.messages((newMessages) => console.log(newMessages))

async function sleep(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms))
}
