import { getFs } from "../client.js"

const fs = getFs()
await fs.writeFile("/test.txt", "works!")
