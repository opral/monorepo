import { getFs } from "../client.js"

const fs = getFs()

try {
	const watcher = await fs.watch("/file.txt")
	for await (const ev of watcher) {
		const content = await fs.readFile("/file.txt", { encoding: "utf8" })
		console.info("worker-2: file changed", content, ev)
	}
} catch (err: unknown) {
	console.info("done", err)
}
