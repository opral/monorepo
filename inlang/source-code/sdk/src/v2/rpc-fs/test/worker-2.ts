import { getFs } from "../client.js"

const fs = getFs()

console.log("worker-2: start")

try {
	const watcher = await fs.watch("/file.txt")
	for await (const _ of watcher) {
		const content = await fs.readFile("/file.txt", { encoding: "utf8" })
		console.info("worker-2: file changed", content)
	}
} catch (err: unknown) {
	console.info("done", err)
}
