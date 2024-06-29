import { getFs } from "./client.js"

const fs = getFs()

const ac = new AbortController()
startWatching("/test.txt", ac.signal)

startEditing("/test.txt")

await sleep(1500)
ac.abort()

async function startWatching(path: string, signal: AbortSignal) {
	const watcher = await fs.watch(path, { signal })
	for await (const event of watcher) {
		console.info(event)
	}
	console.info("done")
}

async function startEditing(path: string) {
	while (true) {
		const randomId = () => Math.random().toString(36).slice(2)
		await fs.writeFile(path, `${randomId()}`)
		await sleep(500)
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
