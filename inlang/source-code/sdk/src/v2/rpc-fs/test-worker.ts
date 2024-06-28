import { getFs } from "./client.js"

const fs = getFs()

const ac = new AbortController()
startWatching("/test.txt" ac.signal)


for(let i = 0; i < 5; i++) {
	const randomId = () => Math.random().toString(36).slice(2)
	await fs.writeFile("/test.txt", `${randomId()}`)
	await sleep(500)
}

ac.abort()

async function startWatching(path: string, signal: AbortSignal) {
	const watcher = await fs.watch(path)
	console.info("watching", path, watcher)
	for await (const event of watcher) {
		console.info(event)
	}
	console.info("done")
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
