import { getFs } from "../client.js"

const fs = getFs()

startEditing("/file.txt")

async function startEditing(path: string) {
	const TRUE = true // shut up eslint
	while (TRUE) {
		const newContent = `${Math.random().toString(36).slice(2)}`
		await fs.writeFile(path, `${newContent}`)

		console.info("worker-1: edited file", newContent)

		await sleep(500)
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
