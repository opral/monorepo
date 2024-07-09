import { endpoint } from "comlink-node/worker"
import { getFs } from "../index.js"

const fs = getFs(endpoint)

try {
	const watcher = fs.watch("/file.txt")
	for await (const ev of watcher) {
		const content = await fs.readFile("/file.txt", { encoding: "utf-8" })
		console.info("worker-2: file changed", content, ev)
	}
} catch (err: unknown) {
	console.info("done", err)
}
