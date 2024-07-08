import { endpoint } from "comlink-node/worker"
import { getFs } from "../../client.js"

const fs = getFs(endpoint)
const content = await fs.readFile("/innn.txt", { encoding: "utf-8" })
await fs.writeFile("/out.txt", content)
