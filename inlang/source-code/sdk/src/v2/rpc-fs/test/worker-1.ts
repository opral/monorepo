import { getFs } from "../client.js"

const fs = getFs()

console.log("worker-1: start")

startEditing("/file.txt")

async function startEditing(path: string) {
	let a = 1
	while (a) {
		const randomId = () => Math.random().toString(36).slice(2)
		await fs.writeFile(path, `${randomId()}`)
		console.log("worker-1: edited file")
		await sleep(500)
		a = 1
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
