import { getFs } from "../../client.js"

const fs = getFs()
console.log("reading...")
const content = await fs.readFile("/innn.txt", { encoding: "utf-8" })
console.info("read", content)
await fs.writeFile("/out.txt", content)
