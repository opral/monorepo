import { endpoint } from "comlink-node/worker"
import { getFs } from "../../client.js"

const fs = getFs(endpoint)

const watcher = fs.watch("/in.txt")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
for await (const ev of watcher) {
	const content = await fs.readFile("/in.txt", { encoding: "utf-8" })
	await fs.writeFile("/out.txt", content)
}
