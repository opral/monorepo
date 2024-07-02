import { endpoint } from "comlink-node/worker"
import { getFs } from "../../client.js"

const fs = getFs(endpoint)
await fs.writeFile("/test.txt", "works!")
