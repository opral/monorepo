import { getFs } from "../client.js"

const fs = getFs()

startEditing("/file.txt")

async function startEditing(path: string) {
	const TRUE = true // shut up eslint
	while (TRUE) {
		await fs.writeFile(path, `${Math.random().toString(36).slice(2)}`)

		console.info("worker-1: edited file")

		await sleep(500)
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
